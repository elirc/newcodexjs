import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "./components/ui/Button.jsx";
import { budgetApi, categoryApi, expenseApi, statsApi } from "./services/api.js";
import styles from "./App.module.css";

const month = "2026-07";
const blankExpense = { amount: "", description: "", category_id: "", expense_date: "2026-07-03", payment_method: "debit_card", is_recurring: false, recurring_interval: "", notes: "" };

/**
 * Renders a dashboard with totals and charts.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
function Dashboard({ summary, byCategory, daily, weekly, recent }) {
  return (
    <div className={styles.grid}>
      <section className={styles.panel}>
        <h2>This month</h2>
        <p><strong>${Number(summary.total_spent || 0).toFixed(2)}</strong> across {summary.expense_count || 0} expenses</p>
        <p>Average expense: ${Number(summary.average_expense || 0).toFixed(2)}</p>
      </section>
      <section className={styles.panel}>
        <h2>By category</h2>
        <ResponsiveContainer height={240}>
          <PieChart>
            <Pie data={byCategory} dataKey="total" nameKey="name" outerRadius={85}>{byCategory.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
      <section className={styles.panel}>
        <h2>Daily spending</h2>
        <ResponsiveContainer height={240}>
          <BarChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#0f766e" /></BarChart>
        </ResponsiveContainer>
      </section>
      <section className={styles.panel}>
        <h2>Weekly trend</h2>
        <ResponsiveContainer height={240}>
          <LineChart data={weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="total" stroke="#2563eb" strokeWidth={3} /></LineChart>
        </ResponsiveContainer>
      </section>
      <section className={styles.panel}>
        <h2>Recent expenses</h2>
        {recent.slice(0, 6).map((expense) => <p key={expense.id}>{expense.description}: ${Number(expense.amount).toFixed(2)}</p>)}
      </section>
    </div>
  );
}

/**
 * Renders an expense form.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
function ExpenseForm({ form, categories, onChange, onSubmit }) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h2>Add expense</h2>
      <input className={styles.input} placeholder="Description" value={form.description} onChange={(event) => onChange("description", event.target.value)} />
      <input className={styles.input} placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={(event) => onChange("amount", event.target.value)} />
      <select className={styles.select} value={form.category_id} onChange={(event) => onChange("category_id", event.target.value)}>
        <option value="">Category</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <input className={styles.input} type="date" value={form.expense_date} onChange={(event) => onChange("expense_date", event.target.value)} />
      <select className={styles.select} value={form.payment_method} onChange={(event) => onChange("payment_method", event.target.value)}>
        <option value="cash">Cash</option><option value="credit_card">Credit card</option><option value="debit_card">Debit card</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option>
      </select>
      <label><input checked={form.is_recurring} onChange={(event) => onChange("is_recurring", event.target.checked)} type="checkbox" /> Recurring</label>
      {form.is_recurring && <select className={styles.select} value={form.recurring_interval} onChange={(event) => onChange("recurring_interval", event.target.value)}><option value="">Interval</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>}
      <Button type="submit">Save expense</Button>
    </form>
  );
}

/**
 * Renders the Expense Tracker app.
 * @returns {JSX.Element}
 */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(blankExpense);
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "tag", color: "#0f766e" });
  const [budgetForm, setBudgetForm] = useState({ month, category_id: "", amount: "" });
  const [stats, setStats] = useState({ summary: {}, byCategory: [], daily: [], weekly: [] });

  /**
   * Reloads API data after writes.
   */
  async function loadData() {
    const [categoryRows, expenseRows, budgetRows, summary, byCategory, daily, weekly] = await Promise.all([
      categoryApi.list(),
      expenseApi.list({ start_date: `${month}-01`, end_date: `${month}-31` }),
      budgetApi.list(month),
      statsApi.monthly(month),
      statsApi.byCategory({ start_date: `${month}-01`, end_date: `${month}-31` }),
      statsApi.daily(month),
      statsApi.weekly(`${month}-01`)
    ]);
    setCategories(categoryRows);
    setExpenses(expenseRows);
    setBudgets(budgetRows);
    setStats({ summary, byCategory, daily, weekly });
  }

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Saves the current expense form.
   * @param {SubmitEvent} event Submit event.
   */
  async function saveExpense(event) {
    event.preventDefault();
    await expenseApi.create(form);
    setForm(blankExpense);
    await loadData();
  }

  /**
   * Downloads filtered expenses as CSV.
   */
  async function exportCsv() {
    const response = await expenseApi.exportCsv({ start_date: `${month}-01`, end_date: `${month}-31` });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.app}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div><h1>Expense Tracker</h1><p>Track spending, budgets, trends, and recurring charges.</p></div>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
        </header>
        <nav className={styles.tabs}>{["dashboard", "expenses", "budgets", "categories"].map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}</nav>

        {tab === "dashboard" && <Dashboard summary={stats.summary} byCategory={stats.byCategory} daily={stats.daily} weekly={stats.weekly} recent={expenses} />}

        {tab === "expenses" && (
          <>
            <ExpenseForm form={form} categories={categories} onChange={(key, value) => setForm({ ...form, [key]: value })} onSubmit={saveExpense} />
            <div className={styles.tableWrap}>
              <table className={styles.table}><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Method</th><th></th></tr></thead><tbody>
                {expenses.map((expense) => <tr key={expense.id}><td>{expense.expense_date}</td><td>{expense.description}</td><td>{expense.category_name}</td><td>${Number(expense.amount).toFixed(2)}</td><td>{expense.payment_method}</td><td><Button variant="danger" onClick={() => expenseApi.remove(expense.id).then(loadData)}>Delete</Button></td></tr>)}
              </tbody></table>
            </div>
          </>
        )}

        {tab === "budgets" && (
          <section className={styles.panel}>
            <h2>Monthly budgets</h2>
            <div className={styles.actions}>
              <select className={styles.select} value={budgetForm.category_id} onChange={(event) => setBudgetForm({ ...budgetForm, category_id: event.target.value })}><option value="">Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
              <input className={styles.input} placeholder="Amount" type="number" value={budgetForm.amount} onChange={(event) => setBudgetForm({ ...budgetForm, amount: event.target.value })} />
              <Button onClick={() => budgetApi.upsert(budgetForm).then(loadData)}>Set budget</Button>
            </div>
            {budgets.map((budget) => <div className={`${styles.budget} ${styles[budget.status]}`} key={budget.id}><strong>{budget.category_name}</strong><p>${Number(budget.spent).toFixed(2)} of ${Number(budget.amount).toFixed(2)} used ({budget.percent_used}%)</p></div>)}
          </section>
        )}

        {tab === "categories" && (
          <section className={styles.panel}>
            <h2>Categories</h2>
            <div className={styles.actions}>
              <input className={styles.input} placeholder="Name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
              <input className={styles.input} placeholder="Icon name" value={categoryForm.icon} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })} />
              <input className={styles.input} type="color" value={categoryForm.color} onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })} />
              <Button onClick={() => categoryApi.create(categoryForm).then(loadData)}>Add</Button>
            </div>
            {categories.map((category) => <p key={category.id}><span style={{ color: category.color }}>{category.icon}</span> {category.name} {category.is_default ? "(default)" : <Button variant="danger" onClick={() => categoryApi.remove(category.id).then(loadData)}>Delete</Button>}</p>)}
          </section>
        )}
      </section>
    </main>
  );
}
