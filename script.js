document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    const taskSelector = document.getElementById('task-selector');
    const taskContainer = document.getElementById('task-container');

    // Handle page navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${button.dataset.page}-page`).classList.add('active');

            if (button.dataset.page === 'basic-info') {
                fetchBasicInfo();
            } else if (button.dataset.page === 'operational-tasks') {
                loadTaskForm(taskSelector.value);
            }
        });
    });

    // Handle operational task selection
    taskSelector.addEventListener('change', (event) => {
        loadTaskForm(event.target.value);
    });

    // Initial load
    fetchBasicInfo();

    // ------------------ API Calls & DOM Manipulation ------------------

    const tableQueries = {
        "Suppliers Contact Details": "Suppliers Contact Details",
        "Products with Supplier and Stock": "Products with Supplier and Stock",
        "Products Needing Reorder": "Products Needing Reorder"
    };

    async function fetchBasicInfo() {
        try {
            const response = await fetch('/api/basic_info');
            const data = await response.json();
            displayBasicMetrics(data.basic_info);
            await displayAdditionalTables();
        } catch (error) {
            console.error('Error fetching basic info:', error);
            displayMessage('Error fetching basic information.', 'error');
        }
    }

    function displayBasicMetrics(metrics) {
        const container = document.getElementById('basic-metrics-section');
        container.innerHTML = '';
        for (const [key, value] of Object.entries(metrics)) {
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.innerHTML = `
                <div class="label">${key}</div>
                <div class="value">${value}</div>
            `;
            container.appendChild(card);
        }
    }

    async function displayAdditionalTables() {
        const container = document.getElementById('additional-tables-section');
        container.innerHTML = '';
        for (const label in tableQueries) {
            const section = document.createElement('div');
            const tableId = `table-${label.replace(/\s/g, '-')}`;
            section.innerHTML = `
                <h3 class="section-header">${label}</h3>
                <div class="table-container" id="${tableId}-container">
                    <table>
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </div>
                <button class="load-more-button" data-table-name="${label}">Load More</button>
            `;
            container.appendChild(section);

            await fetchTableData(label, 0, 10);
            
            section.querySelector('.load-more-button').addEventListener('click', (event) => {
                const tableName = event.target.dataset.tableName;
                const tableBody = document.querySelector(`#table-${tableName.replace(/\s/g, '-')}-container tbody`);
                const offset = tableBody.querySelectorAll('tr').length;
                fetchTableData(tableName, offset, 10);
            });
        }
    }

    async function fetchTableData(tableName, offset, limit) {
        try {
            const response = await fetch(`/api/tables/${encodeURIComponent(tableName)}?offset=${offset}&limit=${limit}`);
            const data = await response.json();
            const tableBody = document.querySelector(`#table-${tableName.replace(/\s/g, '-')}-container tbody`);
            const tableHead = document.querySelector(`#table-${tableName.replace(/\s/g, '-')}-container thead`);
            const loadMoreButton = document.querySelector(`.load-more-button[data-table-name="${tableName}"]`);

            if (offset === 0) {
                tableBody.innerHTML = '';
                tableHead.innerHTML = '';
                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    const headerRow = document.createElement('tr');
                    headers.forEach(header => {
                        const th = document.createElement('th');
                        th.textContent = header.replace(/_/g, ' ');
                        headerRow.appendChild(th);
                    });
                    tableHead.appendChild(headerRow);
                }
            }

            if (data.length > 0) {
                data.forEach(row => {
                    const rowElement = document.createElement('tr');
                    Object.values(row).forEach(value => {
                        const cell = document.createElement('td');
                        cell.textContent = value;
                        rowElement.appendChild(cell);
                    });
                    tableBody.appendChild(rowElement);
                });
            } else {
                loadMoreButton.style.display = 'none';
                if (offset === 0) {
                    tableBody.innerHTML = '<tr><td colspan="100%">No data available.</td></tr>';
                }
            }

            if (data.length < limit) {
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'block';
            }

        } catch (error) {
            console.error('Error fetching table data:', error);
            displayMessage('Error fetching table data.', 'error');
        }
    }

    function loadTaskForm(task) {
        let formHTML = '';
        switch(task) {
            case 'add-product':
                formHTML = `
                    <h3>Add New Product</h3>
                    <form id="add-product-form" class="task-form-container">
                        <div class="form-field">
                            <label for="product-name">Product Name</label>
                            <input type="text" id="product-name" required>
                        </div>
                        <div class="form-field">
                            <label for="product-category">Category</label>
                            <select id="product-category" required></select>
                        </div>
                        <div class="form-field">
                            <label for="product-price">Price</label>
                            <input type="number" id="product-price" step="0.01" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="product-stock">Stock Quantity</label>
                            <input type="number" id="product-stock" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="product-level">Reorder Level</label>
                            <input type="number" id="product-level" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="product-supplier">Supplier</label>
                            <select id="product-supplier" required></select>
                        </div>
                        <div class="form-field">
                            <button type="submit">Add Product</button>
                        </div>
                    </form>
                `;
                taskContainer.innerHTML = formHTML;
                setupSearchableSelects('add-product');
                document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
                break;
            case 'product-history':
                formHTML = `
                    <h3>Product Inventory History</h3>
                    <div class="form-field">
                        <label for="history-product-select">Select a Product</label>
                        <select id="history-product-select"></select>
                    </div>
                    <div id="history-results"></div>
                `;
                taskContainer.innerHTML = formHTML;
                setupSearchableSelects('product-history');
                break;
            case 'place-reorder':
                formHTML = `
                    <h3>Place a Reorder</h3>
                    <form id="place-reorder-form" class="task-form-container">
                        <div class="form-field">
                            <label for="reorder-product-select">Select a Product</label>
                            <select id="reorder-product-select" required></select>
                        </div>
                        <div class="form-field">
                            <label for="reorder-quantity">Reorder Quantity</label>
                            <input type="number" id="reorder-quantity" min="1" required>
                        </div>
                        <div class="form-field">
                            <button type="submit">Place Reorder</button>
                        </div>
                    </form>
                `;
                taskContainer.innerHTML = formHTML;
                setupSearchableSelects('place-reorder');
                document.getElementById('place-reorder-form').addEventListener('submit', handlePlaceReorder);
                break;
            case 'receive-reorder':
                formHTML = `
                    <h3>Mark Reorder as Received</h3>
                    <form id="receive-reorder-form" class="task-form-container">
                        <div class="form-field">
                            <label for="receive-reorder-select">Select Reorder to mark as Received</label>
                            <select id="receive-reorder-select" required></select>
                        </div>
                        <div class="form-field">
                            <button type="submit">Mark as Received</button>
                        </div>
                    </form>
                `;
                taskContainer.innerHTML = formHTML;
                setupSearchableSelects('receive-reorder');
                document.getElementById('receive-reorder-form').addEventListener('submit', handleReceiveReorder);
                break;
            default:
                taskContainer.innerHTML = '';
        }
    }
    
    // Function to make a standard select searchable
    function setupSearchableSelect(selectElement, data, keyName, valueName, optionalCallback = null) {
        const container = document.createElement('div');
        container.className = 'custom-select-container';
        selectElement.parentNode.insertBefore(container, selectElement);
        container.appendChild(selectElement);

        const inputContainer = document.createElement('div');
        inputContainer.className = 'select-input-container';
        container.insertBefore(inputContainer, selectElement);

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'dropdown-input';
        searchInput.placeholder = `Search for a ${String(valueName).replace(/_/g,' ')}`;
        inputContainer.appendChild(searchInput);

        const dropdownList = document.createElement('ul');
        dropdownList.className = 'custom-dropdown-list';
        container.appendChild(dropdownList);

        // ensure the select has options that match `data` so select.value works reliably
        selectElement.innerHTML = '';
        if (Array.isArray(data)) {
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = String(item[keyName] ?? '');
                opt.textContent = item[valueName] ?? '';
                selectElement.appendChild(opt);
            });
        }

        selectElement.style.display = 'none';

        function populateList(filterText = '') {
            dropdownList.innerHTML = '';
            const filteredData = data.filter(item => {
                const name = String(item[valueName] || '').toLowerCase();
                return name.includes(filterText.toLowerCase());
            });

            if (filteredData.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No results found.';
                dropdownList.appendChild(li);
            } else {
                filteredData.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item[valueName];
                    li.dataset.key = item[keyName];
                    li.addEventListener('click', () => {
                        // ensure there's an actual <option> for this value and select it
                        let option = selectElement.querySelector(`option[value="${item[keyName]}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = String(item[keyName]);
                            option.textContent = item[valueName];
                            selectElement.appendChild(option);
                        }
                        selectElement.value = String(item[keyName]);
                        option.selected = true;

                        searchInput.value = item[valueName];
                        dropdownList.classList.remove('active');

                        // emit change so any other logic listening to select's change will run
                        selectElement.dispatchEvent(new Event('change'));

                        if (optionalCallback) {
                            optionalCallback(item[keyName]);
                        }
                    });
                    dropdownList.appendChild(li);
                });
            }
        }

        searchInput.addEventListener('input', () => {
            populateList(searchInput.value);
            dropdownList.classList.add('active');
        });

        searchInput.addEventListener('focus', () => {
            populateList(searchInput.value);
            dropdownList.classList.add('active');
        });

        document.addEventListener('click', (event) => {
            if (!container.contains(event.target)) {
                dropdownList.classList.remove('active');
            }
        });
        
        // Initial population
        populateList();
    }

    async function setupSearchableSelects(task) {
        switch(task) {
            case 'add-product':
                try {
                    const [categoriesResponse, suppliersResponse] = await Promise.all([
                        fetch('/api/categories'),
                        fetch('/api/suppliers')
                    ]);
                    const categories = await categoriesResponse.json();
                    const suppliers = await suppliersResponse.json();
                    
                    const categorySelect = document.getElementById('product-category');
                    const formattedCategories = categories.map(c => ({ id: c, name: c }));
                    setupSearchableSelect(categorySelect, formattedCategories, 'id', 'name');

                    const supplierSelect = document.getElementById('product-supplier');
                    setupSearchableSelect(supplierSelect, suppliers, 'supplier_id', 'supplier_name');
                } catch (error) {
                    displayMessage('Error loading data for Add Product form.', 'error');
                }
                break;
            case 'product-history':
                try {
                    const response = await fetch('/api/products');
                    const products = await response.json();
                    const selectElement = document.getElementById('history-product-select');
                    setupSearchableSelect(selectElement, products, 'product_id', 'product_name', fetchProductHistory);

                } catch (error) {
                    displayMessage('Error loading products list.', 'error');
                }
                break;
            case 'place-reorder':
                try {
                    const response = await fetch('/api/products');
                    const products = await response.json();
                    const selectElement = document.getElementById('reorder-product-select');
                    setupSearchableSelect(selectElement, products, 'product_id', 'product_name');

                } catch (error) {
                    displayMessage('Error loading products list.', 'error');
                }
                break;
            case 'receive-reorder':
                try {
                    const response = await fetch('/api/pending_reorders');
                    const reorders = await response.json();
                    const selectElement = document.getElementById('receive-reorder-select');
                    const formattedReorders = reorders.map(r => ({
                        reorder_id: r.reorder_id,
                        display_name: `ID ${r.reorder_id} - ${r.product_name}`
                    }));
                    setupSearchableSelect(selectElement, formattedReorders, 'reorder_id', 'display_name');

                } catch (error) {
                    displayMessage('Error loading pending reorders.', 'error');
                }
                break;
        }
    }


    async function handleAddProduct(event) {
        event.preventDefault();
        const form = event.target;
        const productName = form.querySelector('#product-name').value;
        const productCategory = form.querySelector('#product-category').value;
        const productPrice = form.querySelector('#product-price').value;
        const productStock = form.querySelector('#product-stock').value;
        const reorderLevel = form.querySelector('#product-level').value;
        const supplierId = form.querySelector('#product-supplier').value;

        try {
            const response = await fetch('/api/add_product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_name: productName,
                    category: productCategory,
                    price: parseFloat(productPrice),
                    stock_quantity: parseInt(productStock),
                    reorder_level: parseInt(reorderLevel),
                    supplier_id: parseInt(supplierId)
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(result.message, 'success');
                form.reset();
            } else {
                displayMessage(`Error: ${result.detail}`, 'error');
            }
        } catch (error) {
            displayMessage(`Error adding product: ${error.message}`, 'error');
        }
    }

    async function fetchProductHistory(productId) {
        const historyResultsDiv = document.getElementById('history-results');
        if (!productId) {
            historyResultsDiv.innerHTML = '<p class="info">Please select a product.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/product_history/${productId}`);
            const history = await response.json();

            if (history.length > 0) {
                const headers = Object.keys(history[0]);
                let tableHTML = '<table><thead><tr>';
                headers.forEach(header => tableHTML += `<th>${header.replace(/_/g, ' ')}</th>`);
                tableHTML += '</tr></thead><tbody>';
                history.forEach(row => {
                    tableHTML += '<tr>';
                    Object.values(row).forEach(value => tableHTML += `<td>${value}</td>`);
                    tableHTML += '</tr>';
                });
                tableHTML += '</tbody></table>';
                historyResultsDiv.innerHTML = tableHTML;
            } else {
                historyResultsDiv.innerHTML = '<p class="info">No history found for this product.</p>';
            }
        } catch (error) {
            console.error('Error fetching product history:', error);
            displayMessage('Error fetching product history.', 'error');
        }
    }

    async function handlePlaceReorder(event) {
        event.preventDefault();
        const form = event.target;
        const productId = form.querySelector('#reorder-product-select').value;
        const quantity = form.querySelector('#reorder-quantity').value;

        if (!productId) {
            displayMessage('Please select a product.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/place_reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: parseInt(productId),
                    reorder_quantity: parseInt(quantity)
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(result.message, 'success');
                form.reset();
            } else {
                displayMessage(`Error: ${result.detail}`, 'error');
            }
        } catch (error) {
            displayMessage(`Error placing reorder: ${error.message}`, 'error');
        }
    }

    async function handleReceiveReorder(event) {
        event.preventDefault();
        const form = event.target;
        const reorderId = form.querySelector('#receive-reorder-select').value;
        if (!reorderId) {
            displayMessage('No pending reorders to receive.', 'info');
            return;
        }

        try {
            const response = await fetch(`/api/receive_reorder/${reorderId}`, {
                method: 'POST'
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(result.message, 'success');
                setupSearchableSelects('receive-reorder'); // Refresh the list
            } else {
                displayMessage(`Error: ${result.detail}`, 'error');
            }
        } catch (error) {
            displayMessage(`Error receiving reorder: ${error.message}`, 'error');
        }
    }

    function displayMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        taskContainer.prepend(messageDiv);
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});
