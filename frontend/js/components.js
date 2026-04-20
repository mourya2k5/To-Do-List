const createTodoElement = (todo, onToggle, onDelete) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    const wrapper = document.createElement('div');
    wrapper.className = 'todo-checkbox-wrapper';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.onchange = (e) => onToggle(todo.id, e.target.checked);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.title;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(text);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete';
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    deleteBtn.onclick = () => onDelete(todo.id);

    li.appendChild(wrapper);
    li.appendChild(deleteBtn);

    return li;
};

const renderTodos = (todos, pendingList, completedList, onToggle, onDelete) => {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    let pendingCount = 0;
    let completedCount = 0;

    todos.forEach(todo => {
        const el = createTodoElement(todo, onToggle, onDelete);
        if (todo.completed) {
            completedList.appendChild(el);
            completedCount++;
        } else {
            pendingList.appendChild(el);
            pendingCount++;
        }
    });

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('completedCount').textContent = completedCount;
};
