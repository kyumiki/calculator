(function() {
    'use strict';

    var PRODUCTS_KEY = 'kbju_products';
    var DIARY_KEY = 'kbju_diary';
    var GOALS_KEY = 'kbju_goals';

    function getProducts() {
        try {
            var data = localStorage.getItem(PRODUCTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveProducts(products) {
        try {
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        } catch (e) {
            alert('Ошибка сохранения продуктов');
        }
    }

    function getDiary() {
        try {
            var data = localStorage.getItem(DIARY_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function saveDiary(diary) {
        try {
            localStorage.setItem(DIARY_KEY, JSON.stringify(diary));
        } catch (e) {
            alert('Ошибка сохранения дневника');
        }
    }

    function getGoals() {
        try {
            var data = localStorage.getItem(GOALS_KEY);
            return data ? JSON.parse(data) : { kcal: 0, protein: 0, fat: 0, carbs: 0 };
        } catch (e) {
            return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
        }
    }

    function saveGoals(goals) {
        try {
            localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
        } catch (e) {
            alert('Ошибка сохранения целей');
        }
    }

    function getTodayKey() {
        var now = new Date();
        return now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
    }

    function getDateKey(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    function getDayTotals(dateKey) {
        var diary = getDiary();
        var entries = diary[dateKey] || [];
        var protein = 0, fat = 0, carbs = 0, kcal = 0;
        for (var i = 0; i < entries.length; i++) {
            protein += entries[i].protein;
            fat += entries[i].fat;
            carbs += entries[i].carbs;
            kcal += entries[i].kcal;
        }
        return { protein: protein, fat: fat, carbs: carbs, kcal: kcal };
    }

    function isDayInGoal(dateKey) {
        var goals = getGoals();
        var totals = getDayTotals(dateKey);
        if (goals.kcal <= 0 && goals.protein <= 0 && goals.fat <= 0 && goals.carbs <= 0) return false;
        var kcalOk = goals.kcal > 0 ? totals.kcal >= goals.kcal * 0.9 : true;
        var proteinOk = goals.protein > 0 ? totals.protein >= goals.protein * 0.9 : true;
        var fatOk = goals.fat > 0 ? totals.fat >= goals.fat * 0.9 : true;
        var carbsOk = goals.carbs > 0 ? totals.carbs >= goals.carbs * 0.9 : true;
        return kcalOk && proteinOk && fatOk && carbsOk;
    }

    function calculateKcal(p, f, c) {
        return (p * 4) + (f * 9) + (c * 4);
    }

    function escapeHtml(text) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function updateGoalIndicator(elementId, dateKey) {
        var el = document.getElementById(elementId);
        if (!el) return;
        var inGoal = isDayInGoal(dateKey);
        var goals = getGoals();
        var hasGoals = goals.kcal > 0 || goals.protein > 0 || goals.fat > 0 || goals.carbs > 0;
        if (hasGoals && inGoal) {
            el.style.display = 'block';
            el.textContent = 'Цель достигнута';
            el.style.background = '#27ae60';
            el.style.color = 'white';
        } else if (hasGoals && !inGoal) {
            el.style.display = 'block';
            el.textContent = 'Цель не достигнута';
            el.style.background = '#c0392b';
            el.style.color = 'white';
        } else {
            el.style.display = 'none';
        }
    }

    function updateProgress(bar, text, current, goal) {
        var pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        bar.style.width = pct + '%';
        text.textContent = current.toFixed(1);

        if (goal > 0 && current >= goal) {
            bar.style.background = '#27ae60';
        } else if (goal > 0 && current >= goal * 0.9) {
            bar.style.background = '#f39c12';
        } else if (goal > 0) {
            bar.style.background = '#c0392b';
        } else {
            bar.style.background = '';
        }
    }

    // ========== СТРАНИЦА ПРОДУКТОВ ==========
    if (document.getElementById('saveProductBtn')) {
        var nameInput = document.getElementById('productNameInput');
        var proteinInput = document.getElementById('productProtein');
        var fatInput = document.getElementById('productFat');
        var carbsInput = document.getElementById('productCarbs');
        var categorySelect = document.getElementById('productCategorySelect');
        var listContainer = document.getElementById('productsListContainer');
        var saveBtn = document.getElementById('saveProductBtn');

        var editingIndex = -1;

        function resetForm() {
            nameInput.value = '';
            proteinInput.value = '';
            fatInput.value = '';
            carbsInput.value = '';
            categorySelect.value = 'Белковые';
            saveBtn.textContent = 'Сохранить продукт';
            editingIndex = -1;
        }

        function renderProducts() {
            var products = getProducts();
            listContainer.innerHTML = '';
            if (products.length === 0) {
                listContainer.innerHTML = '<div class="empty-history">Нет сохраненных продуктов</div>';
                return;
            }
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                var kcal = calculateKcal(product.protein, product.fat, product.carbs);
                var div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML =
                    '<div class="history-item-info" data-index="' + i + '" style="cursor:pointer;">' +
                        '<strong>' + escapeHtml(product.name) + '</strong>' +
                        '<br><small>' + (product.category || 'Другое') + ' · ' + kcal.toFixed(1) + ' ккал / 100 г</small>' +
                        '<br><span class="history-item-macros">Б: ' + product.protein + ' Ж: ' + product.fat + ' У: ' + product.carbs + '</span>' +
                    '</div>' +
                    '<button class="remove-btn" data-index="' + i + '"></button>';
                listContainer.appendChild(div);
            }

            var infoBlocks = listContainer.querySelectorAll('.history-item-info');
            for (var k = 0; k < infoBlocks.length; k++) {
                infoBlocks[k].addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-index'), 10);
                    var prods = getProducts();
                    var product = prods[idx];
                    nameInput.value = product.name;
                    proteinInput.value = product.protein;
                    fatInput.value = product.fat;
                    carbsInput.value = product.carbs;
                    categorySelect.value = product.category || 'Другое';
                    saveBtn.textContent = 'Обновить продукт';
                    editingIndex = idx;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            var removeBtns = listContainer.querySelectorAll('.remove-btn');
            for (var j = 0; j < removeBtns.length; j++) {
                removeBtns[j].addEventListener('click', function(e) {
                    e.stopPropagation();
                    var idx = parseInt(this.getAttribute('data-index'), 10);
                    var prods = getProducts();
                    prods.splice(idx, 1);
                    saveProducts(prods);
                    if (editingIndex === idx) resetForm();
                    renderProducts();
                });
            }
        }

        saveBtn.addEventListener('click', function() {
            var name = nameInput.value.trim();
            var protein = parseFloat(proteinInput.value) || 0;
            var fat = parseFloat(fatInput.value) || 0;
            var carbs = parseFloat(carbsInput.value) || 0;
            var category = categorySelect.value;

            if (!name) {
                alert('Введите название продукта');
                return;
            }

            var products = getProducts();

            if (editingIndex >= 0 && editingIndex < products.length) {
                products[editingIndex] = { name: name, protein: protein, fat: fat, carbs: carbs, category: category };
            } else {
                products.push({ name: name, protein: protein, fat: fat, carbs: carbs, category: category });
            }

            saveProducts(products);
            resetForm();
            renderProducts();
        });

        renderProducts();
    }

    // ========== СТРАНИЦА КАЛЬКУЛЯТОРА ==========
    if (document.getElementById('tabsContainer')) {
        var mealTypeSelect = document.getElementById('mealTypeSelect');
        var gramsInput = document.getElementById('gramsInput');
        var proteinPer100 = document.getElementById('proteinPer100');
        var fatPer100 = document.getElementById('fatPer100');
        var carbsPer100 = document.getElementById('carbsPer100');
        var kcalPer100 = document.getElementById('kcalPer100');
        var calculatedKcal = document.getElementById('calculatedKcal');
        var calculatedProtein = document.getElementById('calculatedProtein');
        var calculatedFat = document.getElementById('calculatedFat');
        var calculatedCarbs = document.getElementById('calculatedCarbs');
        var totalKcalDisplay = document.getElementById('totalKcalDisplay');
        var totalProtein = document.getElementById('totalProtein');
        var totalFat = document.getElementById('totalFat');
        var totalCarbs = document.getElementById('totalCarbs');
        var breakfastContainer = document.getElementById('breakfastContainer');
        var lunchContainer = document.getElementById('lunchContainer');
        var dinnerContainer = document.getElementById('dinnerContainer');
        var addBtn = document.getElementById('addFoodBtn');
        var tabsContainer = document.getElementById('tabsContainer');
        var productList = document.getElementById('productList');

        var indexKcalProgress = document.getElementById('indexKcalProgress');
        var indexProteinProgress = document.getElementById('indexProteinProgress');
        var indexFatProgress = document.getElementById('indexFatProgress');
        var indexCarbsProgress = document.getElementById('indexCarbsProgress');
        var indexKcalProgressText = document.getElementById('indexKcalProgressText');
        var indexProteinProgressText = document.getElementById('indexProteinProgressText');
        var indexFatProgressText = document.getElementById('indexFatProgressText');
        var indexCarbsProgressText = document.getElementById('indexCarbsProgressText');
        var indexGoalKcalDisplay = document.getElementById('indexGoalKcalDisplay');
        var indexGoalProteinDisplay = document.getElementById('indexGoalProteinDisplay');
        var indexGoalFatDisplay = document.getElementById('indexGoalFatDisplay');
        var indexGoalCarbsDisplay = document.getElementById('indexGoalCarbsDisplay');
        var progressPanel = document.getElementById('progressPanel');

        var currentCategory = 'Все';
        var selectedProduct = null;

        function getCategoriesForTabs() {
            var products = getProducts();
            var cats = {};
            for (var i = 0; i < products.length; i++) {
                var cat = products[i].category || 'Другое';
                cats[cat] = true;
            }
            var result = ['Все'];
            var keys = Object.keys(cats).sort();
            for (var j = 0; j < keys.length; j++) {
                result.push(keys[j]);
            }
            return result;
        }

        function renderTabs() {
            var categories = getCategoriesForTabs();
            if (categories.indexOf(currentCategory) === -1) currentCategory = 'Все';
            tabsContainer.innerHTML = '';
            for (var i = 0; i < categories.length; i++) {
                var tab = document.createElement('div');
                tab.className = 'tab' + (categories[i] === currentCategory ? ' active' : '');
                tab.textContent = categories[i];
                tab.addEventListener('click', (function(cat) {
                    return function() { currentCategory = cat; renderTabs(); renderProducts(); };
                })(categories[i]));
                tabsContainer.appendChild(tab);
            }
        }

        function renderProducts() {
            var products = getProducts();
            productList.innerHTML = '';
            for (var i = 0; i < products.length; i++) {
                if (currentCategory !== 'Все' && (products[i].category || 'Другое') !== currentCategory) continue;
                var p = products[i];
                var kcal = calculateKcal(p.protein, p.fat, p.carbs).toFixed(1);
                var card = document.createElement('div');
                card.className = 'product-card';
                if (selectedProduct === p) card.classList.add('selected');
                card.innerHTML = '<strong>' + escapeHtml(p.name) + '</strong><small>' + kcal + ' ккал / 100 г · Б: ' + p.protein + ' Ж: ' + p.fat + ' У: ' + p.carbs + '</small>';
                card.addEventListener('click', (function(product) {
                    return function() {
                        selectedProduct = product;
                        renderProducts();
                        recalculate();
                    };
                })(p));
                productList.appendChild(card);
            }
        }

        function recalculate() {
            var grams = parseFloat(gramsInput.value) || 0;
            if (!selectedProduct || grams <= 0) {
                proteinPer100.textContent = '0';
                fatPer100.textContent = '0';
                carbsPer100.textContent = '0';
                kcalPer100.textContent = '0';
                calculatedKcal.textContent = '0';
                calculatedProtein.textContent = '0';
                calculatedFat.textContent = '0';
                calculatedCarbs.textContent = '0';
                return;
            }
            var p = (selectedProduct.protein * grams) / 100;
            var f = (selectedProduct.fat * grams) / 100;
            var c = (selectedProduct.carbs * grams) / 100;
            var kcal = calculateKcal(p, f, c);
            proteinPer100.textContent = p.toFixed(1);
            fatPer100.textContent = f.toFixed(1);
            carbsPer100.textContent = c.toFixed(1);
            kcalPer100.textContent = kcal.toFixed(1);
            calculatedKcal.textContent = kcal.toFixed(1);
            calculatedProtein.textContent = p.toFixed(1);
            calculatedFat.textContent = f.toFixed(1);
            calculatedCarbs.textContent = c.toFixed(1);
        }

        function updateToday() {
            var today = getTodayKey();
            var totals = getDayTotals(today);
            var goals = getGoals();

            totalProtein.textContent = totals.protein.toFixed(1);
            totalFat.textContent = totals.fat.toFixed(1);
            totalCarbs.textContent = totals.carbs.toFixed(1);
            totalKcalDisplay.textContent = totals.kcal.toFixed(1) + ' ккал';
            updateGoalIndicator('goalIndicator', today);

            var hasGoals = goals.kcal > 0 || goals.protein > 0 || goals.fat > 0 || goals.carbs > 0;
            if (hasGoals) {
                progressPanel.style.display = 'block';
                indexGoalKcalDisplay.textContent = goals.kcal || '—';
                indexGoalProteinDisplay.textContent = goals.protein || '—';
                indexGoalFatDisplay.textContent = goals.fat || '—';
                indexGoalCarbsDisplay.textContent = goals.carbs || '—';
                updateProgress(indexKcalProgress, indexKcalProgressText, totals.kcal, goals.kcal);
                updateProgress(indexProteinProgress, indexProteinProgressText, totals.protein, goals.protein);
                updateProgress(indexFatProgress, indexFatProgressText, totals.fat, goals.fat);
                updateProgress(indexCarbsProgress, indexCarbsProgressText, totals.carbs, goals.carbs);
            } else {
                progressPanel.style.display = 'none';
            }

            renderMealHistory();
        }

        function renderMealHistory() {
            var diary = getDiary();
            var today = getTodayKey();
            var entries = diary[today] || [];

            var breakfast = [];
            var lunch = [];
            var dinner = [];
            var unknown = [];

            for (var i = 0; i < entries.length; i++) {
                if (entries[i].meal === 'breakfast') breakfast.push({ entry: entries[i], index: i });
                else if (entries[i].meal === 'lunch') lunch.push({ entry: entries[i], index: i });
                else if (entries[i].meal === 'dinner') dinner.push({ entry: entries[i], index: i });
                else unknown.push({ entry: entries[i], index: i });
            }

            breakfast = breakfast.concat(unknown);
            renderMealContainer(breakfastContainer, breakfast);
            renderMealContainer(lunchContainer, lunch);
            renderMealContainer(dinnerContainer, dinner);
        }

        function renderMealContainer(container, items) {
            container.innerHTML = '';
            if (items.length === 0) {
                container.innerHTML = '<div class="empty-history">Пока ничего не добавлено</div>';
                return;
            }
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var entry = item.entry;
                var div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML =
                    '<div class="history-item-info">' +
                        '<strong>' + escapeHtml(entry.name) + '</strong>' +
                        '<br><small>' + entry.grams.toFixed(1) + ' г · ' + entry.kcal.toFixed(1) + ' ккал</small>' +
                        '<br><span class="history-item-macros">Б: ' + entry.protein.toFixed(1) + ' Ж: ' + entry.fat.toFixed(1) + ' У: ' + entry.carbs.toFixed(1) + '</span>' +
                    '</div>' +
                    '<button class="remove-btn" data-index="' + item.index + '"></button>';
                container.appendChild(div);
            }
            var removeBtns = container.querySelectorAll('.remove-btn');
            for (var j = 0; j < removeBtns.length; j++) {
                removeBtns[j].addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-index'), 10);
                    var diary = getDiary();
                    var today = getTodayKey();
                    diary[today].splice(idx, 1);
                    saveDiary(diary);
                    updateToday();
                });
            }
        }

        gramsInput.addEventListener('input', recalculate);

        addBtn.addEventListener('click', function() {
            if (!selectedProduct) {
                alert('Выберите продукт');
                return;
            }
            var grams = parseFloat(gramsInput.value);
            if (isNaN(grams) || grams <= 0) {
                alert('Введите количество грамм больше 0');
                return;
            }
            var meal = mealTypeSelect.value;
            var p = (selectedProduct.protein * grams) / 100;
            var f = (selectedProduct.fat * grams) / 100;
            var c = (selectedProduct.carbs * grams) / 100;
            var kcal = calculateKcal(p, f, c);

            var diary = getDiary();
            var today = getTodayKey();
            if (!diary[today]) diary[today] = [];
            diary[today].push({
                name: selectedProduct.name,
                grams: grams,
                protein: p,
                fat: f,
                carbs: c,
                kcal: kcal,
                meal: meal
            });
            saveDiary(diary);
            updateToday();
        });

        renderTabs();
        renderProducts();
        updateToday();
    }

    // ========== СТРАНИЦА КАЛЕНДАРЯ ==========
    if (document.getElementById('datePicker') && !document.getElementById('saveGoalsBtn')) {
        var datePicker = document.getElementById('datePicker');
        var prevBtn = document.getElementById('prevDayBtn');
        var nextBtn = document.getElementById('nextDayBtn');
        var dateTitle = document.getElementById('calendarDateTitle');
        var kcalDisplay = document.getElementById('dayKcalDisplay');
        var proteinSpan = document.getElementById('dayProtein');
        var fatSpan = document.getElementById('dayFat');
        var carbsSpan = document.getElementById('dayCarbs');
        var calendarBreakfastContainer = document.getElementById('calendarBreakfastContainer');
        var calendarLunchContainer = document.getElementById('calendarLunchContainer');
        var calendarDinnerContainer = document.getElementById('calendarDinnerContainer');

        var currentDate = getTodayKey();

        function formatDateTitle(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        }

        function loadDay(dateStr) {
            currentDate = dateStr;
            datePicker.value = dateStr;
            dateTitle.textContent = formatDateTitle(dateStr);

            var totals = getDayTotals(dateStr);
            proteinSpan.textContent = totals.protein.toFixed(1);
            fatSpan.textContent = totals.fat.toFixed(1);
            carbsSpan.textContent = totals.carbs.toFixed(1);
            kcalDisplay.textContent = totals.kcal.toFixed(1) + ' ккал';

            updateGoalIndicator('calendarGoalIndicator', dateStr);

            var summaryEl = document.getElementById('calendarSummary');
            if (summaryEl) {
                if (isDayInGoal(dateStr)) {
                    summaryEl.style.background = '#d5f5e3';
                } else {
                    summaryEl.style.background = '#ede0cc';
                }
            }

            var diary = getDiary();
            var entries = diary[dateStr] || [];

            var breakfast = [];
            var lunch = [];
            var dinner = [];
            var unknown = [];

            for (var i = 0; i < entries.length; i++) {
                if (entries[i].meal === 'breakfast') breakfast.push(entries[i]);
                else if (entries[i].meal === 'lunch') lunch.push(entries[i]);
                else if (entries[i].meal === 'dinner') dinner.push(entries[i]);
                else unknown.push(entries[i]);
            }

            breakfast = breakfast.concat(unknown);
            renderCalendarMealContainer(calendarBreakfastContainer, breakfast);
            renderCalendarMealContainer(calendarLunchContainer, lunch);
            renderCalendarMealContainer(calendarDinnerContainer, dinner);
        }

        function renderCalendarMealContainer(container, entries) {
            container.innerHTML = '';
            if (entries.length === 0) {
                container.innerHTML = '<div class="empty-history">Нет данных</div>';
                return;
            }
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML =
                    '<div class="history-item-info">' +
                        '<strong>' + escapeHtml(entry.name) + '</strong>' +
                        '<br><small>' + entry.grams.toFixed(1) + ' г · ' + entry.kcal.toFixed(1) + ' ккал</small>' +
                        '<br><span class="history-item-macros">Б: ' + entry.protein.toFixed(1) + ' Ж: ' + entry.fat.toFixed(1) + ' У: ' + entry.carbs.toFixed(1) + '</span>' +
                    '</div>';
                container.appendChild(div);
            }
        }

        function changeDay(offset) {
            var parts = currentDate.split('-');
            var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            date.setDate(date.getDate() + offset);
            var newDate = getDateKey(date);
            loadDay(newDate);
        }

        prevBtn.addEventListener('click', function() { changeDay(-1); });
        nextBtn.addEventListener('click', function() { changeDay(1); });
        datePicker.addEventListener('change', function() {
            loadDay(this.value);
        });

        loadDay(getTodayKey());
    }

    // ========== СТРАНИЦА МОЁ ==========
    if (document.getElementById('saveGoalsBtn')) {
        var goalKcalInput = document.getElementById('goalKcal');
        var goalProteinInput = document.getElementById('goalProtein');
        var goalFatInput = document.getElementById('goalFat');
        var goalCarbsInput = document.getElementById('goalCarbs');
        var saveBtn = document.getElementById('saveGoalsBtn');

        var todayKcalDisplay = document.getElementById('todayKcalDisplay');
        var todayProtein = document.getElementById('todayProtein');
        var todayFat = document.getElementById('todayFat');
        var todayCarbs = document.getElementById('todayCarbs');

        var weekStats = document.getElementById('weekStats');

        function loadGoals() {
            var goals = getGoals();
            goalKcalInput.value = goals.kcal || '';
            goalProteinInput.value = goals.protein || '';
            goalFatInput.value = goals.fat || '';
            goalCarbsInput.value = goals.carbs || '';
            updateDisplay();
        }

        function updateDisplay() {
            var goals = getGoals();
            var today = getTodayKey();
            var totals = getDayTotals(today);

            todayKcalDisplay.textContent = totals.kcal.toFixed(1) + ' ккал';
            todayProtein.textContent = totals.protein.toFixed(1);
            todayFat.textContent = totals.fat.toFixed(1);
            todayCarbs.textContent = totals.carbs.toFixed(1);

            updateGoalIndicator('myGoalIndicator', today);

            var summaryEl = document.getElementById('myTodaySummary');
            if (summaryEl) {
                if (isDayInGoal(today)) {
                    summaryEl.style.background = '#d5f5e3';
                } else {
                    summaryEl.style.background = '#ede0cc';
                }
            }

            updateWeekStats();
        }

        function updateWeekStats() {
            var goals = getGoals();
            weekStats.innerHTML = '';

            if (!goals.kcal && !goals.protein && !goals.fat && !goals.carbs) {
                weekStats.innerHTML = '<div class="empty-history">Сначала установите цели</div>';
                return;
            }

            var daysInGoal = 0;
            var totalDays = 0;

            for (var i = 6; i >= 0; i--) {
                var date = new Date();
                date.setDate(date.getDate() - i);
                var key = getDateKey(date);
                totalDays++;

                var allOk = isDayInGoal(key);
                if (allOk) daysInGoal++;

                var totals = getDayTotals(key);
                var dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
                var dateStr = key.split('-')[2] + '.' + key.split('-')[1];

                var div = document.createElement('div');
                div.className = 'history-item';
                div.style.background = allOk ? '#d5f5e3' : '#fffbf5';
                div.innerHTML =
                    '<div class="history-item-info">' +
                        '<strong>' + dayName + ' ' + dateStr + '</strong>' +
                        '<br><small>' + totals.kcal.toFixed(0) + ' ккал</small>' +
                    '</div>' +
                    '<div style="color:' + (allOk ? '#27ae60' : '#c0392b') + ';font-weight:600;">' + (allOk ? 'В норме' : 'Отклонение') + '</div>';
                weekStats.appendChild(div);
            }

            var summaryDiv = document.createElement('div');
            summaryDiv.style.cssText = 'margin-top:0.8rem;padding:0.6rem;background:#ede0cc;border-radius:0.8rem;text-align:center;font-weight:600;';
            summaryDiv.textContent = 'Дней в норме: ' + daysInGoal + ' из ' + totalDays;
            weekStats.appendChild(summaryDiv);
        }

        saveBtn.addEventListener('click', function() {
            var goals = {
                kcal: parseInt(goalKcalInput.value) || 0,
                protein: parseInt(goalProteinInput.value) || 0,
                fat: parseInt(goalFatInput.value) || 0,
                carbs: parseInt(goalCarbsInput.value) || 0
            };
            localStorage.setItem('kbju_goals', JSON.stringify(goals));
            alert('Цели сохранены!');
            updateDisplay();
        });

        loadGoals();
    }

    // ========== СВАЙПЫ МЕЖДУ СТРАНИЦАМИ ==========
    (function() {
        var pages = ['index.html', 'products.html', 'calendar.html', 'my.html'];
        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        var currentIndex = pages.indexOf(currentPage);
        if (currentIndex === -1) currentIndex = 0;

        var touchStartX = 0;
        var touchEndX = 0;

        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            var diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 70) {
                if (diff > 0 && currentIndex < pages.length - 1) {
                    window.location.href = pages[currentIndex + 1];
                } else if (diff < 0 && currentIndex > 0) {
                    window.location.href = pages[currentIndex - 1];
                }
            }
        }, { passive: true });
    })();
})();
