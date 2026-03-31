if (typeof requireAuth === 'undefined') {
    window.location.href = 'login.html';
}

if (!requireAuth()) {
    // requireAuth handles redirects
}

let currentUser = auth.getCurrentUser();
let activeSection = null;

function formatCurrency(amount) {
    return 'UGX ' + Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function refreshUser() {
    currentUser = auth.getCurrentUser();
    return currentUser;
}

function updateDashboardUI() {
    if (!currentUser) return;

    const userNameEl = document.getElementById('userName');
    const balanceEl = document.getElementById('balanceDisplay');
    const accountEl = document.getElementById('accountNumber');

    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (balanceEl) balanceEl.textContent = formatCurrency(currentUser.balance);
    if (accountEl) accountEl.textContent = currentUser.accountNumber;
}

function addTransaction(type, amount, description, newBalance) {
    const transaction = {
        id: Date.now().toString(),
        type: type,
        amount: amount,
        date: new Date().toISOString(),
        newBalance: newBalance,
        description: description
    };

    currentUser.transactions.unshift(transaction);
    auth.updateUser(currentUser);
    refreshUser();
}

function rerenderCurrentSection() {
    if (activeSection) {
        showSection(activeSection);
    }
}

function showSection(section) {
    const contentDiv = document.getElementById('sectionContent');
    if (!contentDiv) return;

    activeSection = section;

    switch (section) {
        case 'overview':
            showOverview(contentDiv);
            break;
        case 'withdraw':
            showWithdraw(contentDiv);
            break;
        case 'deposit':
            showDeposit(contentDiv);
            break;
        case 'savings':
            showSavings(contentDiv);
            break;
        case 'loans':
            showLoans(contentDiv);
            break;
        case 'insurance':
            showInsurance(contentDiv);
            break;
        case 'transfer':
            showTransfer(contentDiv);
            break;
        case 'history':
            showHistory(contentDiv);
            break;
        case 'profile':
            showProfile(contentDiv);
            break;
        default:
            showOverview(contentDiv);
            break;
    }
}

function showOverview(container) {
    container.innerHTML = `
        <h3>📊 Account Overview</h3>
        <div class="grid-2">
            <div>
                <p><strong>Account Holder:</strong> ${currentUser.name}</p>
                <p><strong>Account Number:</strong> ${currentUser.accountNumber}</p>
                <p><strong>Current Balance:</strong> ${formatCurrency(currentUser.balance)}</p>
                <p><strong>Savings Balance:</strong> ${formatCurrency(currentUser.savingsBalance)}</p>
                <p><strong>Member Since:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
                <p><strong>Phone:</strong> ${currentUser.phone || 'Not set'}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Active Loans:</strong> ${currentUser.loans.filter(l => l.status === 'active').length}</p>
                <p><strong>Insurance:</strong> ${currentUser.insurance ? currentUser.insurance.type : 'None'}</p>
            </div>
        </div>
    `;
}

function showWithdraw(container) {
    container.innerHTML = `
        <h3>💸 Withdraw Funds</h3>
        <div class="form-group">
            <label>Amount to Withdraw</label>
            <input type="number" id="withdrawAmount" placeholder="Enter amount" step="0.01" min="1">
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" id="withdrawDesc" placeholder="e.g., ATM withdrawal">
        </div>
        <button class="btn btn-primary" onclick="processWithdraw()">Withdraw</button>
        <div id="withdrawResult" style="margin-top: 1rem;"></div>
        <p style="margin-top: 1rem; color: var(--gray);">Current Balance: ${formatCurrency(currentUser.balance)}</p>
    `;
}

function processWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const description = document.getElementById('withdrawDesc').value || 'ATM withdrawal';
    const resultDiv = document.getElementById('withdrawResult');

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }

    if (amount > currentUser.balance) {
        resultDiv.innerHTML = '<div class="alert alert-error">Insufficient funds. Your balance is ' + formatCurrency(currentUser.balance) + '.</div>';
        return;
    }

    const newBalance = currentUser.balance - amount;
    currentUser.balance = newBalance;
    addTransaction('Withdrawal', amount, description, newBalance);
    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Withdrawal successful! New balance: ' + formatCurrency(newBalance) + '.</div>';
    updateDashboardUI();

    setTimeout(() => rerenderCurrentSection(), 1200);
}

function showDeposit(container) {
    container.innerHTML = `
        <h3>💰 Deposit Funds</h3>
        <div class="form-group">
            <label>Amount to Deposit</label>
            <input type="number" id="depositAmount" placeholder="Enter amount" step="0.01" min="1">
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" id="depositDesc" placeholder="e.g., Cash deposit">
        </div>
        <button class="btn btn-primary" onclick="processDeposit()">Deposit</button>
        <div id="depositResult" style="margin-top: 1rem;"></div>
    `;
}

function processDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDesc').value || 'Cash deposit';
    const resultDiv = document.getElementById('depositResult');

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }

    const newBalance = currentUser.balance + amount;
    currentUser.balance = newBalance;
    addTransaction('Deposit', amount, description, newBalance);
    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Deposit successful! New balance: ' + formatCurrency(newBalance) + '.</div>';
    updateDashboardUI();

    setTimeout(() => rerenderCurrentSection(), 1200);
}

function showSavings(container) {
    container.innerHTML = `
        <h3>📈 Savings Account</h3>
        <div class="grid-2">
            <div>
                <p><strong>Savings Balance:</strong> ${formatCurrency(currentUser.savingsBalance)}</p>
                <p><strong>Interest Rate:</strong> 7% per annum</p>
                <p><strong>Projected Annual Interest:</strong> ${formatCurrency(currentUser.savingsBalance * 0.07)}</p>
            </div>
            <div>
                <div class="form-group">
                    <label>Add to Savings / Withdraw from Savings</label>
                    <input type="number" id="savingsAmount" placeholder="Enter amount" step="0.01">
                </div>
                <button class="btn btn-primary" onclick="addToSavings()">Add to Savings</button>
                <button class="btn btn-secondary" onclick="withdrawFromSavings()" style="margin-top: 0.5rem;">Withdraw from Savings</button>
                <div id="savingsResult" style="margin-top: 1rem;"></div>
            </div>
        </div>
        <hr>
        <h4>Savings History</h4>
        <div id="savingsHistory">
            ${currentUser.savingsHistory.length === 0 ? '<p>No savings transactions yet.</p>' :
                currentUser.savingsHistory.slice(0, 5).map(t => `
                    <div class="transaction-item">
                        <span>${t.type}</span>
                        <span>${formatCurrency(t.amount)}</span>
                        <span>${formatDate(t.date)}</span>
                    </div>
                `).join('')
            }
        </div>
    `;
}

function addToSavings() {
    const amount = parseFloat(document.getElementById('savingsAmount').value);
    const resultDiv = document.getElementById('savingsResult');

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }

    if (amount > currentUser.balance) {
        resultDiv.innerHTML = '<div class="alert alert-error">Insufficient funds in your main account.</div>';
        return;
    }

    currentUser.balance -= amount;
    currentUser.savingsBalance += amount;
    currentUser.savingsHistory.unshift({
        type: 'Deposit to Savings',
        amount: amount,
        date: new Date().toISOString()
    });

    addTransaction('Transfer to Savings', amount, 'Transferred to savings account', currentUser.balance);
    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Added to savings! New savings balance: ' + formatCurrency(currentUser.savingsBalance) + '.</div>';
    updateDashboardUI();
    setTimeout(() => rerenderCurrentSection(), 1000);
}

function withdrawFromSavings() {
    const amount = parseFloat(document.getElementById('savingsAmount').value);
    const resultDiv = document.getElementById('savingsResult');

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }

    if (amount > currentUser.savingsBalance) {
        resultDiv.innerHTML = '<div class="alert alert-error">Insufficient savings balance.</div>';
        return;
    }

    currentUser.balance += amount;
    currentUser.savingsBalance -= amount;
    currentUser.savingsHistory.unshift({
        type: 'Withdraw from Savings',
        amount: amount,
        date: new Date().toISOString()
    });

    addTransaction('Withdraw from Savings', amount, 'Withdrawn from savings account', currentUser.balance);
    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Withdrawn from savings! New savings balance: ' + formatCurrency(currentUser.savingsBalance) + '.</div>';
    updateDashboardUI();
    setTimeout(() => rerenderCurrentSection(), 1000);
}

function showLoans(container) {
    const activeLoans = currentUser.loans.filter(l => l.status === 'active');
    const completedLoans = currentUser.loans.filter(l => l.status === 'completed');

    container.innerHTML = `
        <h3>🏦 Loan Services</h3>
        <div class="grid-2">
            <div>
                <h4>Apply for a Loan</h4>
                <div class="form-group">
                    <label>Loan Amount</label>
                    <input type="number" id="loanAmount" placeholder="Enter amount" step="0.01">
                </div>
                <div class="form-group">
                    <label>Loan Type</label>
                    <select id="loanType">
                        <option value="personal">Personal Loan (12% APR)</option>
                        <option value="business">Business Loan (10% APR)</option>
                        <option value="education">Education Loan (8% APR)</option>
                        <option value="mortgage">Mortgage (15% APR)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tenure (Months)</label>
                    <select id="loanTenure">
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                        <option value="24">24 months</option>
                        <option value="36">36 months</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="applyForLoan()">Apply for Loan</button>
                <div id="loanResult" style="margin-top: 1rem;"></div>
            </div>
            <div>
                <h4>Active Loans</h4>
                ${activeLoans.length === 0 ? '<p>No active loans.</p>' :
                    activeLoans.map(loan => `
                        <div style="border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
                            <p><strong>${loan.type} Loan</strong></p>
                            <p>Amount: ${formatCurrency(loan.amount)}</p>
                            <p>Remaining: ${formatCurrency(loan.remaining)}</p>
                            <p>Monthly Payment: ${formatCurrency(loan.monthlyPayment)}</p>
                            <p>Status: <span style="color: var(--primary);">${loan.status}</span></p>
                        </div>
                    `).join('')
                }
                <h4 style="margin-top: 1rem;">Loan History</h4>
                ${completedLoans.length === 0 ? '<p>No completed loans.</p>' :
                    completedLoans.map(loan => `
                        <div style="border: 1px solid var(--border); padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px;">
                            <p><strong>${loan.type}</strong> - ${formatCurrency(loan.amount)} - Paid off</p>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

function applyForLoan() {
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const type = document.getElementById('loanType').options[document.getElementById('loanType').selectedIndex].text;
    const tenure = parseInt(document.getElementById('loanTenure').value, 10);
    const resultDiv = document.getElementById('loanResult');

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid loan amount.</div>';
        return;
    }

    if (amount > 50000) {
        resultDiv.innerHTML = '<div class="alert alert-error">Maximum loan amount is UGX 50,000.</div>';
        return;
    }

    const monthlyPayment = (amount / tenure) * 1.1;
    const totalPayment = monthlyPayment * tenure;

    const newLoan = {
        id: Date.now().toString(),
        type: type,
        amount: amount,
        tenure: tenure,
        monthlyPayment: monthlyPayment,
        remaining: totalPayment,
        status: 'active',
        appliedDate: new Date().toISOString()
    };

    currentUser.loans.push(newLoan);
    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Loan application approved! Amount: ' + formatCurrency(amount) + '.</div>';
    updateDashboardUI();
    setTimeout(() => rerenderCurrentSection(), 1200);
}

function showInsurance(container) {
    container.innerHTML = `
        <h3>🛡️ Insurance Services</h3>
        ${currentUser.insurance ? `
            <div class="alert alert-info">
                <strong>Active Insurance:</strong> ${currentUser.insurance.type}<br>
                <strong>Premium:</strong> ${formatCurrency(currentUser.insurance.premium)}/month<br>
                <strong>Start Date:</strong> ${formatDate(currentUser.insurance.startDate)}
            </div>
        ` : '<div class="alert alert-info">No active insurance policy.</div>'}

        <h4>Available Insurance Plans</h4>
        <div class="grid-3">
            <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px;">
                <h4>Basic Health</h4>
                <p>Premium: UGX 50/month</p>
                <p>Coverage: Up to UGX 5,000</p>
                <button class="btn btn-secondary" onclick="applyInsurance('Basic Health', 50)">Select Plan</button>
            </div>
            <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px;">
                <h4>Premium Health</h4>
                <p>Premium: UGX 150/month</p>
                <p>Coverage: Up to UGX 20,000</p>
                <button class="btn btn-secondary" onclick="applyInsurance('Premium Health', 150)">Select Plan</button>
            </div>
            <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px;">
                <h4>Life Insurance</h4>
                <p>Premium: UGX 100/month</p>
                <p>Coverage: UGX 50,000</p>
                <button class="btn btn-secondary" onclick="applyInsurance('Life Insurance', 100)">Select Plan</button>
            </div>
        </div>
        <div id="insuranceResult" style="margin-top: 1rem;"></div>
    `;
}

function applyInsurance(type, premium) {
    currentUser.insurance = {
        active: true,
        type: type,
        premium: premium,
        startDate: new Date().toISOString()
    };

    auth.updateUser(currentUser);
    refreshUser();

    const result = document.getElementById('insuranceResult');
    if (result) {
        result.innerHTML = '<div class="alert alert-success">✓ ' + type + ' insurance activated successfully!</div>';
    }

    updateDashboardUI();
    setTimeout(() => rerenderCurrentSection(), 1200);
}

function showTransfer(container) {
    container.innerHTML = `
        <h3>↪️ Fund Transfer</h3>
        <div class="form-group">
            <label>Transfer Type</label>
            <select id="transferType" onchange="toggleTransferFields()">
                <option value="within">Transfer Within Sente Yo Credits</option>
                <option value="other">Transfer To Another Bank</option>
            </select>
        </div>
        <div id="transferFields">
            <div class="form-group">
                <label>Recipient Account Number</label>
                <input type="text" id="recipientAccount" placeholder="Enter account number">
            </div>
            <div class="form-group" id="bankNameField" style="display: none;">
                <label>Bank Name</label>
                <input type="text" id="bankName" placeholder="Enter bank name">
            </div>
            <div class="form-group">
                <label>Recipient Name</label>
                <input type="text" id="recipientName" placeholder="Enter recipient name">
            </div>
            <div class="form-group">
                <label>Amount</label>
                <input type="number" id="transferAmount" placeholder="Enter amount" step="0.01">
            </div>
            <div class="form-group">
                <label>Description (Optional)</label>
                <input type="text" id="transferDesc" placeholder="Transfer reference">
            </div>
            <button class="btn btn-primary" onclick="processTransfer()">Transfer Funds</button>
        </div>
        <div id="transferResult" style="margin-top: 1rem;"></div>
        <p style="margin-top: 1rem; color: var(--gray);">Current Balance: ${formatCurrency(currentUser.balance)}</p>
    `;
}

function toggleTransferFields() {
    const transferType = document.getElementById('transferType').value;
    const bankField = document.getElementById('bankNameField');
    if (bankField) {
        bankField.style.display = transferType === 'other' ? 'block' : 'none';
    }
}

function processTransfer() {
    const transferType = document.getElementById('transferType').value;
    const recipientAccount = document.getElementById('recipientAccount').value.trim();
    const recipientName = document.getElementById('recipientName').value.trim();
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const description = document.getElementById('transferDesc').value.trim() || 'Fund transfer';
    const resultDiv = document.getElementById('transferResult');
    const bankName = transferType === 'other' ? document.getElementById('bankName').value.trim() : 'Sente Yo Credits';

    if (!recipientAccount || !recipientName) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please fill in all recipient details.</div>';
        return;
    }

    if (transferType === 'other' && !bankName) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter the recipient bank name.</div>';
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid amount.</div>';
        return;
    }

    if (amount > currentUser.balance) {
        resultDiv.innerHTML = '<div class="alert alert-error">Insufficient funds.</div>';
        return;
    }

    const fee = transferType === 'other' ? amount * 0.01 : 0;
    const totalDeduction = amount + fee;

    if (totalDeduction > currentUser.balance) {
        resultDiv.innerHTML = '<div class="alert alert-error">Insufficient funds including transfer fee of ' + formatCurrency(fee) + '.</div>';
        return;
    }

    const newBalance = currentUser.balance - totalDeduction;
    currentUser.balance = newBalance;

    const transferDesc = `Transfer to ${recipientName} (${recipientAccount}) at ${bankName}${fee > 0 ? ' - Fee: ' + formatCurrency(fee) : ''}`;
    addTransaction('Transfer', amount, transferDesc, newBalance);

    if (fee > 0) {
        addTransaction('Transfer Fee', fee, `Transfer fee for ${description}`, newBalance);
    }

    auth.updateUser(currentUser);
    refreshUser();

    resultDiv.innerHTML = '<div class="alert alert-success">✓ Transfer successful! ' + formatCurrency(amount) + ' sent to ' + recipientName + '.<br>New balance: ' + formatCurrency(newBalance) + '.</div>';
    updateDashboardUI();

    document.getElementById('recipientAccount').value = '';
    document.getElementById('recipientName').value = '';
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferDesc').value = '';
    if (document.getElementById('bankName')) {
        document.getElementById('bankName').value = '';
    }

    setTimeout(() => rerenderCurrentSection(), 1200);
}

function showHistory(container) {
    container.innerHTML = `
        <h3>📜 Transaction History</h3>
        ${currentUser.transactions.length === 0 ? '<p>No transactions yet.</p>' :
            `<div style="max-height: 430px; overflow-y: auto;">
                ${currentUser.transactions.map(t => `
                    <div class="transaction-item" style="border-bottom: 1px solid var(--border); padding: 0.8rem;">
                        <div>
                            <strong>${t.type}</strong><br>
                            <small>${formatDate(t.date)}</small><br>
                            <span style="font-size: 0.85rem;">${t.description || ''}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: ${t.type === 'Deposit' ? 'var(--primary)' : t.type === 'Withdrawal' ? 'var(--danger)' : 'var(--secondary)'}">
                                ${t.type === 'Deposit' ? '+' : '-'} ${formatCurrency(t.amount)}
                            </span>
                            <br>
                            <small>Balance: ${formatCurrency(t.newBalance)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>`
        }
    `;
}

function showProfile(container) {
    container.innerHTML = `
        <h3>⚙️ Profile Settings</h3>
        <form id="profileForm">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="profileName" value="${currentUser.name}">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="profilePhone" value="${currentUser.phone || ''}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="profileAddress" value="${currentUser.profile.address || ''}">
            </div>
            <div class="form-group">
                <label>City</label>
                <input type="text" id="profileCity" value="${currentUser.profile.city || ''}">
            </div>
            <div class="form-group">
                <label>Country</label>
                <input type="text" id="profileCountry" value="${currentUser.profile.country || 'Uganda'}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifyEmail" ${currentUser.profile.notificationEmail ? 'checked' : ''}>
                    Email Notifications
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifySMS" ${currentUser.profile.notificationSMS ? 'checked' : ''}>
                    SMS Notifications
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Update Profile</button>
            <div id="profileResult" style="margin-top: 1rem;"></div>
        </form>
    `;

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();

        currentUser.name = document.getElementById('profileName').value;
        currentUser.phone = document.getElementById('profilePhone').value;
        currentUser.profile.address = document.getElementById('profileAddress').value;
        currentUser.profile.city = document.getElementById('profileCity').value;
        currentUser.profile.country = document.getElementById('profileCountry').value;
        currentUser.profile.notificationEmail = document.getElementById('notifyEmail').checked;
        currentUser.profile.notificationSMS = document.getElementById('notifySMS').checked;

        auth.updateUser(currentUser);
        refreshUser();

        document.getElementById('profileResult').innerHTML = '<div class="alert alert-success">✓ Profile updated successfully!</div>';
        updateDashboardUI();

        setTimeout(() => {
            const result = document.getElementById('profileResult');
            if (result) {
                result.innerHTML = '';
            }
        }, 2500);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    refreshUser();

    if (!currentUser) return;

    updateDashboardUI();

    const sectionContent = document.getElementById('sectionContent');
    if (sectionContent) {
        const initialSection = document.body.dataset.initialSection || 'overview';
        showSection(initialSection);
    }
});

window.showSection = showSection;
window.processWithdraw = processWithdraw;
window.processDeposit = processDeposit;
window.addToSavings = addToSavings;
window.withdrawFromSavings = withdrawFromSavings;
window.applyForLoan = applyForLoan;
window.applyInsurance = applyInsurance;
window.processTransfer = processTransfer;
window.toggleTransferFields = toggleTransferFields;
window.formatCurrency = formatCurrency;
