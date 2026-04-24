const crypto = require('crypto');
const redisClient = require('../config/redis');
const { sendSuccess, sendError } = require('../utils/response');

exports.getTodos = async (req, res) => {
    try {
        const userId = req.user.id;
        const todoIds = await redisClient.sMembers(`user:${userId}:todos`);
        
        if (todoIds.length === 0) {
            return sendSuccess(res, []);
        }

        const todosPromises = todoIds.map(id => redisClient.hGetAll(`todo:${id}`));
        const todos = await Promise.all(todosPromises);
        
        const parsedTodos = todos.map(todo => ({
            ...todo,
            completed: todo.completed === 'true'
        }));

        parsedTodos.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

        sendSuccess(res, parsedTodos);
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.createTodo = async (req, res) => {
    try {
        const { title, dueDate } = req.body;
        const userId = req.user.id;

        if (!title) {
            return sendError(res, 'Title is required', 400);
        }

        const todoId = crypto.randomUUID();
        const newTodo = {
            id: todoId,
            title,
            completed: 'false',
            dueDate: dueDate || '',
            createdAt: new Date().toISOString()
        };

        await redisClient.hSet(`todo:${todoId}`, newTodo);
        await redisClient.sAdd(`user:${userId}:todos`, todoId);

        sendSuccess(res, { ...newTodo, completed: false }, 201);
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed, title, dueDate } = req.body;
        const userId = req.user.id;

        const updateFields = {};
        if (completed !== undefined) {
            if (typeof completed !== 'boolean') {
                return sendError(res, 'completed must be a boolean', 400);
            }
            updateFields.completed = String(completed);
        }
        if (title !== undefined) updateFields.title = title;
        if (dueDate !== undefined) updateFields.dueDate = dueDate;

        const isMember = await redisClient.sIsMember(`user:${userId}:todos`, id);
        if (!isMember) {
            return sendError(res, 'Todo not found or unauthorized', 404);
        }

        if (Object.keys(updateFields).length > 0) {
            await redisClient.hSet(`todo:${id}`, updateFields);
        }

        sendSuccess(res, { id, ...updateFields });
    } catch (error) {
        sendError(res, error.message, 500);
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const isMember = await redisClient.sIsMember(`user:${userId}:todos`, id);
        if (!isMember) {
            return sendError(res, 'Todo not found or unauthorized', 404);
        }

        await redisClient.del(`todo:${id}`);
        await redisClient.sRem(`user:${userId}:todos`, id);

        sendSuccess(res, { message: 'Todo deleted' });
    } catch (error) {
        sendError(res, error.message, 500);
    }
};
