let start = Date.now();
let currentMode = '2 marks';
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load chat history from sessionStorage
    const savedHistory = sessionStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        updateChatHistorySidebar();
    }
    
    // Enable Enter key for question input
    const questionInput = document.getElementById('question');
    if (questionInput) {
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                askAI();
            }
        });
    }
});

// Save chat to history
function saveChatToHistory(topic, question, answer, marks) {
    const chatItem = {
        id: Date.now(),
        topic: topic || 'General',
        question: question,
        answer: answer,
        marks: marks,
        timestamp: new Date().toISOString()
    };
    
    chatHistory.push(chatItem);
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    updateChatHistorySidebar();
}

// Update chat history sidebar
function updateChatHistorySidebar() {
    const historyDiv = document.getElementById('chatHistory');
    if (!historyDiv) return;
    
    if (chatHistory.length === 0) {
        historyDiv.innerHTML = '<p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; padding: 20px 0;">No history yet</p>';
        return;
    }
    
    // Show last 5 chats
    const recentChats = chatHistory.slice(-5).reverse();
    historyDiv.innerHTML = recentChats.map(chat => `
        <div class="history-item" onclick="loadChatFromHistory(${chat.id})">
            <div class="history-topic">${chat.topic}</div>
            <div class="history-question">${chat.question}</div>
        </div>
    `).join('');
}

// Load chat from history
function loadChatFromHistory(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    // Fill the inputs
    document.getElementById('topic').value = chat.topic;
    document.getElementById('question').value = chat.question;
    document.getElementById('marks').value = chat.marks;
    
    // Show the previous answer
    const initialState = document.getElementById('initialState');
    const messagesDiv = document.getElementById('messages');
    initialState.style.display = 'none';
    messagesDiv.classList.add('active');
    
    addMessage('user', chat.question, chat.topic, chat.marks);
    addMessage('bot', chat.answer, chat.topic, chat.marks);
}

// New Chat
function newChat() {
    const messagesDiv = document.getElementById('messages');
    const initialState = document.getElementById('initialState');
    
    if (messagesDiv) {
        messagesDiv.innerHTML = '';
        messagesDiv.classList.remove('active');
    }
    
    if (initialState) {
        initialState.style.display = 'flex';
    }
    
    document.getElementById('topic').value = '';
    document.getElementById('question').value = '';
    document.getElementById('marks').value = '2';
    start = Date.now();
    
    showNotification('New chat started!', 'success');
}

// Set Topic from sidebar
function setTopic(topicName) {
    document.getElementById('topic').value = topicName;
    
    // Show in chat area
    const initialState = document.getElementById('initialState');
    const messagesDiv = document.getElementById('messages');
    
    if (initialState && initialState.style.display !== 'none') {
        // First time - just set and focus
        document.getElementById('question').placeholder = `Ask anything about ${topicName}...`;
        document.getElementById('question').focus();
        showNotification(`Topic set to: ${topicName}`, 'success');
    } else {
        // Already chatting - add a message
        document.getElementById('question').placeholder = `Ask anything about ${topicName}...`;
        document.getElementById('question').focus();
        showNotification(`Topic changed to: ${topicName}`, 'info');
    }
}

// Quick Actions
function quickAction(action) {
    const questionInput = document.getElementById('question');
    const marksSelect = document.getElementById('marks');
    
    switch(action) {
        case '2 marks':
            marksSelect.value = '2';
            currentMode = '2 marks';
            questionInput.focus();
            break;
        case 'detailed':
            marksSelect.value = '10';
            currentMode = 'detailed';
            questionInput.focus();
            break;
        case 'explain':
            questionInput.placeholder = 'What concept would you like me to explain?';
            questionInput.focus();
            break;
        case 'example':
            if (document.getElementById('topic').value) {
                questionInput.value = `Give me example questions on ${document.getElementById('topic').value}`;
                askAI();
            } else {
                questionInput.placeholder = 'Enter a topic first...';
                document.getElementById('topic').focus();
            }
            break;
        case 'summary':
            if (document.getElementById('topic').value) {
                questionInput.value = `Summarize ${document.getElementById('topic').value} for quick revision`;
                askAI();
            } else {
                questionInput.placeholder = 'Enter a topic first...';
                document.getElementById('topic').focus();
            }
            break;
    }
}

// Main Ask AI Function
function askAI() {
    const topicVal = document.getElementById('topic').value.trim();
    const questionVal = document.getElementById('question').value.trim();
    const marksVal = document.getElementById('marks').value;
    
    if (!questionVal) {
        showNotification('Please enter a question!', 'warning');
        return;
    }
    
    // Hide initial state, show messages
    const initialState = document.getElementById('initialState');
    const messagesDiv = document.getElementById('messages');
    
    if (initialState) {
        initialState.style.display = 'none';
    }
    if (messagesDiv) {
        messagesDiv.classList.add('active');
    }
    
    // Add user message
    addMessage('user', questionVal, topicVal, marksVal);
    
    // Add loading message
    const loadingId = addMessage('bot', '<span class="loading"></span> Thinking...', '', '');
    
    // Clear input
    document.getElementById('question').value = '';
    
    // Fetch answer
    fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            topic: topicVal,
            question: questionVal,
            marks: marksVal,
            time: (Date.now() - start) / 1000
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Server Error');
        return res.json();
    })
    .then(data => {
        // Remove loading message
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) {
            loadingMsg.remove();
        }
        // Add actual answer
        addMessage('bot', data.answer, topicVal, marksVal);
        
        // Save to history
        saveChatToHistory(topicVal, questionVal, data.answer, marksVal);
    })
    .catch(error => {
        console.error('Error:', error);
        const loadingMsg = document.getElementById(loadingId);
        if (loadingMsg) {
            loadingMsg.remove();
        }
        addMessage('bot', '⚠️ Error: Could not get answer. Please try again.', '', '');
    });
}

// Add Message to Chat
function addMessage(type, content, topic, marks) {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return '';
    
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const messageHTML = `
        <div class="message ${type}" id="${messageId}">
            <div class="message-bubble">
                <div class="message-header">
                    <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
                    <span>${type === 'user' ? 'You' : 'ExamAI'}</span>
                    ${marks ? `<span>• ${marks} marks</span>` : ''}
                    ${topic ? `<span>• ${topic}</span>` : ''}
                </div>
                <div class="message-content">${content}</div>
            </div>
        </div>
    `;
    
    messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
    
    // Scroll to bottom
    const chatArea = document.getElementById('chatArea');
    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    return messageId;
}

// Load Report (Modal)
function loadReport() {
    const modal = document.getElementById('reportModal');
    const reportDiv = document.getElementById('report');
    
    reportDiv.innerHTML = '<div class=\"loading\"></div> Loading analytics...';
    modal.classList.add('active');
    
    fetch('/report')
        .then(res => res.json())
        .then(data => {
            let html = '<div style=\"color: white;\">';
            
            if (Object.keys(data).length === 0) {
                html += '<p style=\"text-align: center; padding: 40px; opacity: 0.7;\">No data yet. Start asking questions to see your performance!</p>';
            } else {
                for (const [topic, stats] of Object.entries(data)) {
                    const percentage = ((stats.correct / stats.attempts) * 100).toFixed(0);
                    const isWeak = percentage < 60;
                    
                    html += `
                        <div style=\"background: rgba(255,255,255,0.1); padding: 20px; margin-bottom: 16px; border-radius: 12px; border-left: 4px solid ${isWeak ? '#ff6b6b' : '#51cf66'};\">
                            <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;\">
                                <h3 style=\"margin: 0; font-size: 18px;\">${topic}</h3>
                                <span style=\"background: ${isWeak ? 'rgba(255,107,107,0.2)' : 'rgba(81,207,102,0.2)'}; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;\">${percentage}%</span>
                            </div>
                            <div style=\"display: flex; gap: 20px; font-size: 14px; color: rgba(255,255,255,0.7);\">
                                <span><i class=\"fas fa-check-circle\" style=\"color: #51cf66;\"></i> ${stats.correct} correct</span>
                                <span><i class=\"fas fa-times-circle\" style=\"color: #ff6b6b;\"></i> ${stats.attempts - stats.correct} incorrect</span>
                                <span><i class=\"fas fa-clock\"></i> ${stats.avg_time.toFixed(1)}s avg</span>
                            </div>
                            ${isWeak ? '<p style=\"margin-top: 12px; font-size: 13px; color: #ffd43b;\"><i class=\"fas fa-lightbulb\"></i> Needs more practice</p>' : ''}
                        </div>
                    `;
                }
            }
            
            html += '</div>';
            reportDiv.innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            reportDiv.innerHTML = '<p style=\"color: #ff6b6b; text-align: center;\">⚠️ Error loading report</p>';
        });
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show Coming Soon Message
function showComingSoon(feature) {
    showNotification(`${feature} feature coming soon! 🚀`, 'info');
}

// Export Chat
function exportChat() {
    const messages = document.querySelectorAll('.message');
    if (messages.length === 0) {
        showNotification('No messages to export!', 'warning');
        return;
    }
    
    let exportText = 'ExamAI Chat Export\\n';
    exportText += '='.repeat(60) + '\\n';
    exportText += `Date: ${new Date().toLocaleString()}\\n`;
    exportText += '='.repeat(60) + '\\n\\n';
    
    messages.forEach((msg, index) => {
        const isUser = msg.classList.contains('user');
        const type = isUser ? 'YOU' : 'ExamAI';
        const content = msg.querySelector('.message-content');
        if (content) {
            const text = content.innerText || content.textContent;
            exportText += `${type}:\\n${text}\\n\\n`;
            exportText += '-'.repeat(60) + '\\n\\n';
        }
    });
    
    exportText += '\\nGenerated by ExamAI - Exam Preparation Assistant\\n';
    
    try {
        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `examai-chat-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Chat exported successfully! 📥', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export chat', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const colors = {
        success: '#51cf66',
        warning: '#ffd43b',
        error: '#ff6b6b',
        info: '#667eea'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 10000;
        animation: slideIn 0.3s;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('reportModal');
    if (e.target === modal) {
        closeModal();
    }
});