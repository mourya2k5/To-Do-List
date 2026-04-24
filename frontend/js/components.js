const getPinnedTodos = () => {
    return JSON.parse(localStorage.getItem('pinnedTodos') || '[]');
};

const togglePin = (id) => {
    let pinned = getPinnedTodos();
    if (pinned.includes(id)) {
        pinned = pinned.filter(pId => pId !== id);
    } else {
        pinned.push(id);
    }
    localStorage.setItem('pinnedTodos', JSON.stringify(pinned));
    if (typeof updateUI === 'function') updateUI();
};

const createTodoElement = (todo, onToggle, onDelete, onEdit) => {
    const isPinned = getPinnedTodos().includes(todo.id);
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''} ${isPinned ? 'pinned' : ''}`;
    li.dataset.id = todo.id;

    const wrapper = document.createElement('div');
    wrapper.className = 'todo-checkbox-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.flex = '1';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.onchange = (e) => onToggle(todo.id, e.target.checked);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-content-div';
    contentDiv.style.flex = "1";
    contentDiv.style.display = "flex";
    contentDiv.style.flexDirection = "column";

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.title;

    contentDiv.appendChild(text);

    if (todo.dueDate) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'todo-date text-secondary';
        dateSpan.style.fontSize = "12px";
        dateSpan.textContent = `Due: ${new Date(todo.dueDate).toLocaleString()}`;
        contentDiv.appendChild(dateSpan);
    }

    wrapper.appendChild(checkbox);
    wrapper.appendChild(contentDiv);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'todo-actions';
    actionsWrapper.style.display = "flex";
    actionsWrapper.style.gap = "8px";
    
    const pinBtn = document.createElement('button');
    pinBtn.className = `todo-pin btn-icon pin-btn ${isPinned ? 'active' : ''}`;
    pinBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
    pinBtn.onclick = () => togglePin(todo.id);

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-edit btn-icon';
    editBtn.style.background = 'none';
    editBtn.style.border = 'none';
    editBtn.style.cursor = 'pointer';
    editBtn.style.color = 'var(--text-secondary)';
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete btn-icon';
    deleteBtn.style.background = 'none';
    deleteBtn.style.border = 'none';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = 'var(--text-secondary)';
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    deleteBtn.onclick = () => onDelete(todo.id);

    actionsWrapper.appendChild(pinBtn);
    actionsWrapper.appendChild(editBtn);
    actionsWrapper.appendChild(deleteBtn);

    // Edit Mode Form Elements
    const editForm = document.createElement('div');
    editForm.className = 'todo-edit-form hidden';
    editForm.style.flex = "1";
    editForm.style.display = "none";
    editForm.style.gap = "8px";
    editForm.style.flexDirection = "column";

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = todo.title;
    editInput.style.padding = "4px 8px";

    const editDate = document.createElement('input');
    editDate.type = 'datetime-local';
    editDate.value = todo.dueDate || '';
    editDate.style.padding = "4px 8px";

    const saveCancelWrapper = document.createElement('div');
    saveCancelWrapper.style.display = "flex";
    saveCancelWrapper.style.gap = "8px";

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn primary small';
    saveBtn.onclick = () => {
        if (!editInput.value.trim()) return;
        onEdit(todo.id, editInput.value.trim(), editDate.value);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn secondary small';
    cancelBtn.onclick = () => {
        editForm.style.display = 'none';
        wrapper.style.display = 'flex';
        actionsWrapper.style.display = 'flex';
    };

    saveCancelWrapper.appendChild(saveBtn);
    saveCancelWrapper.appendChild(cancelBtn);
    
    editForm.appendChild(editInput);
    editForm.appendChild(editDate);
    editForm.appendChild(saveCancelWrapper);

    editBtn.onclick = () => {
        wrapper.style.display = 'none';
        actionsWrapper.style.display = 'none';
        editForm.style.display = 'flex';
    };

    li.appendChild(wrapper);
    li.appendChild(editForm);
    li.appendChild(actionsWrapper);

    return li;
};

const renderTodos = (todos, pendingList, completedList, onToggle, onDelete, onEdit) => {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    let pendingCount = 0;
    let completedCount = 0;
    
    const pinnedIds = getPinnedTodos();

    // Sort: pinned first
    const sortedTodos = [...todos].sort((a, b) => {
        const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
        const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
        return bPinned - aPinned; 
    });

    sortedTodos.forEach(todo => {
        const el = createTodoElement(todo, onToggle, onDelete, onEdit);
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
