if (typeof requireAuth === 'undefined') {
    window.location.href = 'login.html';
}

if (!requireAuth()) {
    // requireAuth handles redirects
}

let currentUser = auth.getCurrentUser();
let hideBalances = false;

function formatCurrency(amount) {
    return 'UGX ' + Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-UG', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function maskedValue(value) {
    return hideBalances ? '••••••' : value;
}

function renderHome() {
    if (!currentUser) return;

    const userName = document.getElementById('homeUserName');
    const accountNo = document.getElementById('homeAccountNumber');
    const avatar = document.getElementById('homeAvatar');
    const balance = document.getElementById('homeBalance');
    const savings = document.getElementById('homeSavings');
    const loans = document.getElementById('homeLoans');
    const insurance = document.getElementById('homeInsurance');

    if (userName) userName.textContent = currentUser.name;
    if (accountNo) accountNo.textContent = 'Account • ' + currentUser.accountNumber;
    if (balance) balance.textContent = maskedValue(formatCurrency(currentUser.balance));
    if (savings) savings.textContent = maskedValue(formatCurrency(currentUser.savingsBalance));
    if (loans) loans.textContent = currentUser.loans.filter(l => l.status === 'active').length.toString();
    if (insurance) insurance.textContent = currentUser.insurance ? currentUser.insurance.type : 'None';
    if (avatar) avatar.textContent = (currentUser.name || 'U').trim().charAt(0).toUpperCase();

    renderRecentActivity();
}

function renderRecentActivity() {
    const recentList = document.getElementById('homeRecentList');
    if (!recentList || !currentUser) return;

    const recentTransactions = [...(currentUser.transactions || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

    if (recentTransactions.length === 0) {
        recentList.innerHTML = '<div class="dashboard-empty-state">No transactions yet. Start with a deposit or transfer.</div>';
        return;
    }

    recentList.innerHTML = recentTransactions.map(t => {
        const isCredit = t.type === 'Deposit';
        const sign = isCredit ? '+' : '-';
        const amountClass = isCredit ? 'dashboard-amount-credit' : 'dashboard-amount-debit';
        const badge = (t.type || 'TR').replace(/\s+/g, '').slice(0, 2).toUpperCase();

        return `
            <div class="recent-item dashboard-recent-item">
                <div class="dashboard-recent-left">
                    <span class="dashboard-tx-badge">${badge}</span>
                    <div>
                        <strong class="dashboard-tx-title">${t.type}</strong>
                        <p class="dashboard-tx-copy">${t.description || 'Transaction update'}</p>
                        <small class="dashboard-tx-date">${formatDate(t.date)}</small>
                    </div>
                </div>
                <div class="recent-amount ${amountClass}">
                    ${hideBalances ? '••••••' : `${sign} ${formatCurrency(t.amount)}`}
                </div>
            </div>
        `;
    }).join('');
}

function toggleBalances() {
    hideBalances = !hideBalances;
    const button = document.getElementById('toggleBalances');
    if (button) {
        button.textContent = hideBalances ? 'Show' : 'Hide';
    }
    renderHome();
}

document.addEventListener('DOMContentLoaded', function() {
    currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    renderHome();

    const toggleButton = document.getElementById('toggleBalances');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleBalances);
    }
});
