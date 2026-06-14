(function () {
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
        var kcalOk = goals.kcal > 0 ? totals.kcal >= goals.kcal : true;
        var proteinOk = goals.protein > 0 ? totals.protein >= goals.protein : true;
        var fatOk = goals.fat > 0 ? totals.fat >= goals.fat : true;
        var carbsOk = goals.carbs > 0 ? totals.carbs >= goals.carbs : true;
        return kcalOk && proteinOk && fatOk && carbsOk;
    }

    function calculateKcal(p, f, c) {
        return (p * 4) + (f * 9) + (c * 4);
    }

    function escapeHtml(text) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
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

    // ========== СТРАНИЦА ПРОДУКТОВ ==========
    if (document.getElementById('saveProductBtn')) {
        var nameInput = document.getElementById('productNameInput');
        var proteinInput = document.getElementById('productProtein');
        var fatInput = document.getElementById('productFat');
        var carbsInput = document.getElementById('productCarbs');
        var listContainer = document.getElementById('productsListContainer');
        var saveBtn = document.getElementById('saveProductBtn');

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
                div.innerHTML = '<div><strong>' + escapeHtml(product.name) + '</strong><br><small>Б: ' + product.protein + ' г · Ж: ' + product.fat + ' г · У: ' + product.carbs + ' г · ' + kcal.toFixed(1) + ' ккал / 100 г</small></div>' +
                    '<button class="remove-btn" data-index="' + i + '">&times;</button>';
                listContainer.appendChild(div);
            }
            var removeBtns = document.querySelectorAll('.remove-btn');
            for (var j = 0; j < removeBtns.length; j++) {
                removeBtns[j].addEventListener('click', function () {
                    var idx = parseInt(this.getAttribute('data-index'), 10);
                    var prods = getProducts();
                    prods.splice(idx, 1);
                    saveProducts(prods);
                    renderProducts();
                });
            }
        }

        saveBtn.addEventListener('click', function () {
            var name = nameInput.value.trim();
            var protein = parseFloat(proteinInput.value) || 0;
            var fat = parseFloat(fatInput.value) || 0;
            var carbs = parseFloat(carbsInput.value) || 0;

            if (!name) {
                alert('Введите название продукта');
                return;
            }

            var products = getProducts();
            products.push({ name: name, protein: protein, fat: fat, carbs: carbs });
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
        var foodSelect = document.getElementById('foodSelect');
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
        var historyContainer = document.getElementById('historyContainer');
        var addBtn = document.getElementById('addFoodBtn');

        var selectedProduct = null;

        function populateSelect() {
            var products = getProducts();
            foodSelect.innerHTML = '<option value="">Выберите продукт</option>';
            for (var i = 0; i < products.length; i++) {
                var option = document.createElement('option');
                option.value = i;
                option.textContent = products[i].name;
                foodSelect.appendChild(option);
            }
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
            var grams = parseFloat(gramsInput.value) || 0;
            if (!selectedProduct || grams <= 0) {
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
            calculatedProtein.textContent = p.toFixed(1);
            calculatedFat.textContent = f.toFixed(1);
            calculatedCarbs.textContent = c.toFixed(1);
            calculatedKcal.textContent = kcal.toFixed(1);
        }

        function updateToday() {
            var today = getTodayKey();
            var totals = getDayTotals(today);
            totalProtein.textContent = totals.protein.toFixed(1);
            totalFat.textContent = totals.fat.toFixed(1);
            totalCarbs.textContent = totals.carbs.toFixed(1);
            totalKcalDisplay.textContent = totals.kcal.toFixed(1) + ' ккал';
            updateGoalIndicator('goalIndicator', today);
            renderTodayHistory();
        }

        function renderTodayHistory() {
            var diary = getDiary();
            var today = getTodayKey();
            var entries = diary[today] || [];
            historyContainer.innerHTML = '';
            if (entries.length === 0) {
                historyContainer.innerHTML = '<div class="empty-history">Пока ничего не добавлено</div>';
                return;
            }
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = '<div><strong>' + escapeHtml(entry.name) + '</strong><br><small>' + entry.grams.toFixed(1) + ' г · ' + entry.kcal.toFixed(1) + ' ккал</small></div>' +
                    '<div><span>Б: ' + entry.protein.toFixed(1) + ' Ж: ' + entry.fat.toFixed(1) + ' У: ' + entry.carbs.toFixed(1) + '</span>' +
                    '<button class="remove-btn" data-index="' + i + '">&times;</button></div>';
                historyContainer.appendChild(div);
            }
            var removeBtns = document.querySelectorAll('#historyContainer .remove-btn');
            for (var j = 0; j < removeBtns.length; j++) {
                removeBtns[j].addEventListener('click', function () {
                    var idx = parseInt(this.getAttribute('data-index'), 10);
                    var diary = getDiary();
                    var today = getTodayKey();
                    diary[today].splice(idx, 1);
                    saveDiary(diary);
                    updateToday();
                });
            }
        }

        foodSelect.addEventListener('change', function () {
            var index = parseInt(this.value);
            var products = getProducts();
            selectedProduct = products[index] || null;
            updateDisplay();
        });

        gramsInput.addEventListener('input', recalculate);

        addBtn.addEventListener('click', function () {
            if (!selectedProduct) {
                alert('Выберите продукт');
                return;
            }
            var grams = parseFloat(gramsInput.value);
            if (isNaN(grams) || grams <= 0) {
                alert('Введите количество грамм больше 0');
                return;
            }
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
    if (document.getElementById('datePicker') && !document.getElementById('saveGoalsBtn')) {
        var datePicker = document.getElementById('datePicker');
        var prevBtn = document.getElementById('prevDayBtn');
        var nextBtn = document.getElementById('nextDayBtn');
        var todayBtn = document.getElementById('todayBtn');
        var dateTitle = document.getElementById('calendarDateTitle');
        var kcalDisplay = document.getElementById('dayKcalDisplay');
        var proteinSpan = document.getElementById('dayProtein');
        var fatSpan = document.getElementById('dayFat');
        var carbsSpan = document.getElementById('dayCarbs');
        var historyContainer = document.getElementById('calendarHistoryContainer');

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
            historyContainer.innerHTML = '';
            if (entries.length === 0) {
                historyContainer.innerHTML = '<div class="empty-history">Нет данных за этот день</div>';
                return;
            }
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = '<div><strong>' + escapeHtml(entry.name) + '</strong><br><small>' + entry.grams.toFixed(1) + ' г · ' + entry.kcal.toFixed(1) + ' ккал</small></div>' +
                    '<div><span>Б: ' + entry.protein.toFixed(1) + ' Ж: ' + entry.fat.toFixed(1) + ' У: ' + entry.carbs.toFixed(1) + '</span></div>';
                historyContainer.appendChild(div);
            }
        }

        function changeDay(offset) {
            var parts = currentDate.split('-');
            var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            date.setDate(date.getDate() + offset);
            var newDate = getDateKey(date);
            loadDay(newDate);
        }

        prevBtn.addEventListener('click', function () { changeDay(-1); });
        nextBtn.addEventListener('click', function () { changeDay(1); });
        todayBtn.addEventListener('click', function () { loadDay(getTodayKey()); });
        datePicker.addEventListener('change', function () {
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

        var kcalProgress = document.getElementById('kcalProgress');
        var proteinProgress = document.getElementById('proteinProgress');
        var fatProgress = document.getElementById('fatProgress');
        var carbsProgress = document.getElementById('carbsProgress');

        var kcalProgressText = document.getElementById('kcalProgressText');
        var proteinProgressText = document.getElementById('proteinProgressText');
        var fatProgressText = document.getElementById('fatProgressText');
        var carbsProgressText = document.getElementById('carbsProgressText');

        var goalKcalDisplay = document.getElementById('goalKcalDisplay');
        var goalProteinDisplay = document.getElementById('goalProteinDisplay');
        var goalFatDisplay = document.getElementById('goalFatDisplay');
        var goalCarbsDisplay = document.getElementById('goalCarbsDisplay');

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

            goalKcalDisplay.textContent = goals.kcal || '—';
            goalProteinDisplay.textContent = goals.protein || '—';
            goalFatDisplay.textContent = goals.fat || '—';
            goalCarbsDisplay.textContent = goals.carbs || '—';

            updateProgress(kcalProgress, kcalProgressText, totals.kcal, goals.kcal, 'kcal');
            updateProgress(proteinProgress, proteinProgressText, totals.protein, goals.protein, 'protein');
            updateProgress(fatProgress, fatProgressText, totals.fat, goals.fat, 'fat');
            updateProgress(carbsProgress, carbsProgressText, totals.carbs, goals.carbs, 'carbs');

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

        function updateProgress(bar, text, current, goal, type) {
            var pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
            bar.style.width = pct + '%';
            text.textContent = current.toFixed(1);

            if (goal > 0 && current >= goal) {
                bar.style.background = '#27ae60';
            } else if (goal > 0 && pct >= 90) {
                bar.style.background = '#e67e22';
            } else if (goal > 0) {
                bar.style.background = '#c0392b';
            } else {
                bar.style.background = '';
            }
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
                div.innerHTML = '<div><strong>' + dayName + ' ' + dateStr + '</strong><br><small>' + totals.kcal.toFixed(0) + ' ккал</small></div>' +
                    '<div style="color:' + (allOk ? '#27ae60' : '#c0392b') + ';font-weight:600;">' + (allOk ? 'В норме' : 'Отклонение') + '</div>';
                weekStats.appendChild(div);
            }

            var summaryDiv = document.createElement('div');
            summaryDiv.style.cssText = 'margin-top:0.8rem;padding:0.6rem;background:#ede0cc;border-radius:0.8rem;text-align:center;font-weight:600;';
            summaryDiv.textContent = 'Дней в норме: ' + daysInGoal + ' из ' + totalDays;
            weekStats.appendChild(summaryDiv);
        }

        saveBtn.addEventListener('click', function () {
            var goals = {
                kcal: parseInt(goalKcalInput.value) || 0,
                protein: parseInt(goalProteinInput.value) || 0,
                fat: parseInt(goalFatInput.value) || 0,
                carbs: parseInt(goalCarbsInput.value) || 0
            };
            saveGoals(goals);
            alert('Цели сохранены!');
            updateDisplay();
        });

        loadGoals();
    }
})();