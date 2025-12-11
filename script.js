// ===============================
// Expense Tracker JavaScript
// ===============================

// ---------- GLOBALS & DOM ELEMENTS ----------
const form = document.getElementById("transaction-form");
const historyBody = document.getElementById("history-body");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance-amount");
const darkModeToggle = document.getElementById("toggle-dark-mode");
const downloadCSVBtn = document.getElementById("download-csv");
const downloadJSONBtn = document.getElementById("download-json");
const chartCanvas = document.getElementById("monthly-trend-chart");

// ---------- STATE & LOCAL STORAGE KEYS ----------
const STORAGE_KEY = "trackerTransactions";
const THEME_KEY = "trackerTheme";
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ---------- SAVE TO LOCAL STORAGE ----------
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ---------- UTILS ----------
function formatCurrency(num) {
    return "₹" + (num < 0 ? "-" : "") + Math.abs(num).toFixed(2);
}

// ---------- DARK MODE ----------
function initTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }
}
darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(THEME_KEY, darkModeToggle.checked ? "dark" : "light");
});
initTheme();

// ---------- FORM SUBMISSION ----------
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const type = document.getElementById("trans-type").value;
    const desc = document.getElementById("trans-desc").value.trim();
    const amount = parseFloat(document.getElementById("trans-amount").value);
    const date = document.getElementById("trans-date").value;

    if (!desc || isNaN(amount) || !date) {
        alert("Please enter valid values!");
        return;
    }

    transactions.push({
        id: Date.now(),
        type,
        desc,
        amount,
        date
    });

    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    updateChart();
    form.reset();
});

// ---------- RENDER HISTORY ----------
function renderTransactions() {
    historyBody.innerHTML = "";
    transactions.forEach((t) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${t.desc}</td>
            <td>${t.type}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td>${t.date}</td>
            <td>
                <button onclick="editTransaction(${t.id})">✏️</button>
                <button onclick="deleteTransaction(${t.id})">🗑️</button>
            </td>`;
        historyBody.appendChild(tr);
    });
}
window.renderTransactions = renderTransactions;

// ---------- DELETE / EDIT ----------
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    updateChart();
}

function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    document.getElementById("trans-desc").value = tx.desc;
    document.getElementById("trans-amount").value = tx.amount;
    document.getElementById("trans-type").value = tx.type;
    document.getElementById("trans-date").value = tx.date;
    deleteTransaction(id);
}

// ---------- SUMMARY ----------
function updateSummary() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    balanceEl.textContent = formatCurrency(income - expense);
}
updateSummary();

// ---------- CHART.JS SETUP ----------
let monthlyChart;
function initChart() {
    const ctx = chartCanvas.getContext("2d");
    monthlyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Income",
                    backgroundColor: "#4caf50",
                    data: []
                },
                {
                    label: "Expense",
                    backgroundColor: "#f44336",
                    data: []
                }
            ]
        },
       options: {
    responsive: true,
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                color: getComputedStyle(document.body).getPropertyValue("--chart-text-light")
            },
            grid: {
                color: getComputedStyle(document.body).getPropertyValue("--chart-grid-light")
            }
        },
        x: {
            ticks: {
                color: getComputedStyle(document.body).getPropertyValue("--chart-text-light")
            },
            grid: {
                color: getComputedStyle(document.body).getPropertyValue("--chart-grid-light")
            }
        }
    },
    plugins: {
        legend: {
            labels: {
                color: getComputedStyle(document.body).getPropertyValue("--chart-text-light")
            }
        }
    }
}
 
    });
}
    
 
initChart();

// ---------- UPDATE CHART ----------
function updateChart() {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const incomeData = [];
    const expenseData = [];

    months.forEach(m => {
        const monthStr = m.toString().padStart(2, "0");
        const monthTransactions = transactions.filter(t => t.date.split("-")[1] === monthStr);
        incomeData.push(monthTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0));
        expenseData.push(monthTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0));
    });

    monthlyChart.data.labels = months.map(m => `M${m}`);
    monthlyChart.data.datasets[0].data = incomeData;
    monthlyChart.data.datasets[1].data = expenseData;
    monthlyChart.update();
}
updateChart();

// ---------- DOWNLOAD CSV ----------
downloadCSVBtn.addEventListener("click", () => {
    const headers = ["Description", "Type", "Amount", "Date"];
    const rows = transactions.map(t => [
        t.desc,
        t.type,
        t.amount,
        t.date
    ]);
    const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "expense_data.csv";
    link.click();
});

// ---------- DOWNLOAD JSON ----------
downloadJSONBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expense_data.json";
    link.click();
});

// ---------- INITIAL RENDER ----------
renderTransactions();
updateSummary();
updateChart();
