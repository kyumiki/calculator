(function () {
    const PRODUCTS_KEY = 'kbju_products';
    const DIARY_KEY = 'kbju_diary';

    function getProducts() {
        const data = localStorage.getItem(PRODUCTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveProducts(products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    function getDiary() {
        const data = localStorage.getItem(DIARY_KEY);
        return data ? JSON.parse(data) : {};
    }

    function saveDiary(diary) {
        localStorage.setItem(DIARY_KEY, JSON.stringify(diary));
    }

    function getTodayKey() {
        const now = new Date();
        return now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
    }

    function calculateKcal(p, f, c) {
        return (p * 4) + (f * 9) + (c * 4);
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    const page = document.body;

    // ========== СТРАНИЦА ПРОДУКТОВ ==========
    if (document.getElementById('saveProductBtn')) {
        const nameInput = document.getElementById('productNameInput');
        const proteinInput = document.getElementById('productProtein');
        const fatInput = document.getElementById('productFat');
        const carbsInput = document.getElementById('productCarbs');
        const listContainer = document.getElementById('productsListContainer');
        const saveBtn = document.getElementById('saveProductBtn');

        function renderProducts() {
            const products = getProducts();
            listContainer.innerHTML = '';
            if (products.length === 0) {
                listContainer.innerHTML = '<div class="empty-history">Нет сохраненных продуктов</div>';
                return;
            }
            products.forEach((product, index) => {
                const kcal = calculateKcal(product.protein, product.fat, product.carbs);
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        <br><small>Б: ${product.protein} г · Ж: ${product.fat} г · У: ${product.carbs} г · ${kcal.toFixed(1)} ккал / 100 г</small>
                    </div>
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                listContainer.appendChild(div);
            });
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.dataset.index, 10);
                    const products = getProducts();
                    products.splice(idx, 1);
                    saveProducts(products);
                    renderProducts();
                });
            });
        }

        saveBtn.addEventListener('click', function () {
            const name = nameInput.value.trim();
            const protein = parseFloat(proteinInput.value) || 0;
            const fat = parseFloat(fatInput.value) || 0;
            const carbs = parseFloat(carbsInput.value) || 0;

            if (!name) {
                alert('Введите название продукта');
                return;
            }

            const products = getProducts();
            products.push({ name, protein, fat, carbs });
            saveProducts(products);

            nameInput.value = '';
            proteinInput.value = '';
            fatInput.value = '';
            carbsInput.value = '';
            renderProducts();
        });

        renderProducts();
    }

    // ========== СТРАНИЦА КАЛЬКУЛЯТОРА ==========
    if (document.getElementById('foodSelect')) {
        const foodSelect = document.getElementById('foodSelect');
        const gramsInput = document.getElementById('gramsInput');
        const proteinPer100 = document.getElementById('proteinPer100');
        const fatPer100 = document.getElementById('fatPer100');
        const carbsPer100 = document.getElementById('carbsPer100');
        const kcalPer100 = document.getElementById('kcalPer100');
        const calculatedKcal = document.getElementById('calculatedKcal');
        const calculatedProtein = document.getElementById('calculatedProtein');
        const calculatedFat = document.getElementById('calculatedFat');
        const calculatedCarbs = document.getElementById('calculatedCarbs');
        const totalKcalDisplay = document.getElementById('totalKcalDisplay');
        const totalProtein = document.getElementById('totalProtein');
        const totalFat = document.getElementById('totalFat');
        const totalCarbs = document.getElementById('totalCarbs');
        const historyContainer = document.getElementById('historyContainer');
        const addBtn = document.getElementById('addFoodBtn');

        let selectedProduct = null;

        function populateSelect() {
            const products = getProducts();
            foodSelect.innerHTML = '<option value="">Выберите продукт</option>';
            products.forEach((product, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = product.name;
                foodSelect.appendChild(option);
            });
        }

        function updateDisplay() {
            if (selectedProduct) {
                proteinPer100.textContent = selectedProduct.protein;
                fatPer100.textContent = selectedProduct.fat;
                carbsPer100.textContent = selectedProduct.carbs;
                kcalPer100.textContent = calculateKcal(selectedProduct.protein, selectedProduct.fat, selectedProduct.carbs).toFixed(1);
            } else {
                proteinPer100.textContent = '0';
                fatPer100.textContent = '0';
                carbsPer100.textContent = '0';
                kcalPer100.textContent = '0';
            }
            recalculate();
        }

        function recalculate() {
            const grams = parseFloat(gramsInput.value) || 0;
            if (!selectedProduct || grams <= 0) {
                calculatedKcal.textContent = '0';
                calculatedProtein.textContent = '0';
                calculatedFat.textContent = '0';
                calculatedCarbs.textContent = '0';
                return;
            }
            const p = (selectedProduct.protein * grams) / 100;
            const f = (selectedProduct.fat * grams) / 100;
            const c = (selectedProduct.carbs * grams) / 100;
            const kcal = calculateKcal(p, f, c);
            calculatedProtein.textContent = p.toFixed(1);
            calculatedFat.textContent = f.toFixed(1);
            calculatedCarbs.textContent = c.toFixed(1);
            calculatedKcal.textContent = kcal.toFixed(1);
        }

        function updateToday() {
            const diary = getDiary();
            const today = getTodayKey();
            const entries = diary[today] || [];
            let tp = 0, tf = 0, tc = 0, tk = 0;
            entries.forEach(e => {
                tp += e.protein;
                tf += e.fat;
                tc += e.carbs;
                tk += e.kcal;
            });
            totalProtein.textContent = tp.toFixed(1);
            totalFat.textContent = tf.toFixed(1);
            totalCarbs.textContent = tc.toFixed(1);
            totalKcalDisplay.textContent = tk.toFixed(1) + ' ккал';
            renderTodayHistory();
        }

        function renderTodayHistory() {
            const diary = getDiary();
            const today = getTodayKey();
            const entries = diary[today] || [];
            historyContainer.innerHTML = '';
            if (entries.length === 0) {
                historyContainer.innerHTML = '<div class="empty-history">Пока ничего не добавлено</div>';
                return;
            }
            entries.forEach((entry, index) => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div>
                        <strong>${escapeHtml(entry.name)}</strong>
                        <br><small>${entry.grams.toFixed(1)} г · ${entry.kcal.toFixed(1)} ккал</small>
                    </div>
                    <div>
                        <span>Б: ${entry.protein.toFixed(1)} Ж: ${entry.fat.toFixed(1)} У: ${entry.carbs.toFixed(1)}</span>
                        <button class="remove-btn" data-index="${index}">×</button>
                    </div>
                `;
                historyContainer.appendChild(div);
            });
            document.querySelectorAll('#historyContainer .remove-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.dataset.index, 10);
                    const diary = getDiary();
                    const today = getTodayKey();
                    diary[today].splice(idx, 1);
                    saveDiary(diary);
                    updateToday();
                });
            });
        }

        foodSelect.addEventListener('change', function () {
            const index = parseInt(this.value);
            const products = getProducts();
            selectedProduct = products[index] || null;
            updateDisplay();
        });

        gramsInput.addEventListener('input', recalculate);

        addBtn.addEventListener('click', function () {
            if (!selectedProduct) {
                alert('Выберите продукт');
                return;
            }
            const grams = parseFloat(gramsInput.value);
            if (isNaN(grams) || grams <= 0) {
                alert('Введите количество грамм больше 0');
                return;
            }
            const p = (selectedProduct.protein * grams) / 100;
            const f = (selectedProduct.fat * grams) / 100;
            const c = (selectedProduct.carbs * grams) / 100;
            const kcal = calculateKcal(p, f, c);

            const diary = getDiary();
            const today = getTodayKey();
            if (!diary[today]) diary[today] = [];
            diary[today].push({
                name: selectedProduct.name,
                grams: grams,
                protein: p,
                fat: f,
                carbs: c,
                kcal: kcal
            });
            saveDiary(diary);
            updateToday();
        });

        populateSelect();
        updateDisplay();
        updateToday();
    }

    // ========== СТРАНИЦА КАЛЕНДАРЯ ==========
    if (document.getElementById('datePicker')) {
        const datePicker = document.getElementById('datePicker');
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        const todayBtn = document.getElementById('todayBtn');
        const dateTitle = document.getElementById('calendarDateTitle');
        const kcalDisplay = document.getElementById('dayKcalDisplay');
        const proteinSpan = document.getElementById('dayProtein');
        const fatSpan = document.getElementById('dayFat');
        const carbsSpan = document.getElementById('dayCarbs');
        const historyContainer = document.getElementById('calendarHistoryContainer');

        let currentDate = getTodayKey();

        function formatDateTitle(dateStr) {
            const parts = dateStr.split('-');
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        }

        function loadDay(dateStr) {
            currentDate = dateStr;
            datePicker.value = dateStr;
            dateTitle.textContent = formatDateTitle(dateStr);

            const diary = getDiary();
            const entries = diary[dateStr] || [];
            let tp = 0, tf = 0, tc = 0, tk = 0;
            entries.forEach(e => {
                tp += e.protein;
                tf += e.fat;
                tc += e.carbs;
                tk += e.kcal;
            });
            proteinSpan.textContent = tp.toFixed(1);
            fatSpan.textContent = tf.toFixed(1);
            carbsSpan.textContent = tc.toFixed(1);
            kcalDisplay.textContent = tk.toFixed(1) + ' ккал';

            historyContainer.innerHTML = '';
            if (entries.length === 0) {
                historyContainer.innerHTML = '<div class="empty-history">Нет данных за этот день</div>';
                return;
            }
            entries.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div>
                        <strong>${escapeHtml(entry.name)}</strong>
                        <br><small>${entry.grams.toFixed(1)} г · ${entry.kcal.toFixed(1)} ккал</small>
                    </div>
                    <div>
                        <span>Б: ${entry.protein.toFixed(1)} Ж: ${entry.fat.toFixed(1)} У: ${entry.carbs.toFixed(1)}</span>
                    </div>
                `;
                historyContainer.appendChild(div);
            });
        }

        function changeDay(offset) {
            const parts = currentDate.split('-');
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            date.setDate(date.getDate() + offset);
            const newDate = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
            loadDay(newDate);
        }

        prevBtn.addEventListener('click', () => changeDay(-1));
        nextBtn.addEventListener('click', () => changeDay(1));
        todayBtn.addEventListener('click', () => loadDay(getTodayKey()));
        datePicker.addEventListener('change', function () {
            loadDay(this.value);
        });

        loadDay(getTodayKey());
    }
})();