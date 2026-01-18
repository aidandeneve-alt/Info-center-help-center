class ApexDataHelpCenter {
    constructor() {
        this.issues = JSON.parse(localStorage.getItem('apexIssues')) || [];
        this.ratings = JSON.parse(localStorage.getItem('apexRatings')) || [];
        this.messages = JSON.parse(localStorage.getItem('apexMessages')) || {};
        this.users = JSON.parse(localStorage.getItem('apexUsers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('apexCurrentUser')) || null;
        this.currentRating = 0;
        this.isAdminLoggedIn = false;
        this.adminEmails = JSON.parse(localStorage.getItem('apexAdminEmails')) || ['aidan.deneve1@outlook.com'];
        this.currentFilter = 'all';
        this.selectedIssueId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAdminPanel();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('homeBtn').addEventListener('click', () => this.showSection('homeSection'));
        document.getElementById('infoBtn').addEventListener('click', () => this.showSection('infoSection'));
        document.getElementById('reportBtn').addEventListener('click', () => this.showSection('reportSection'));
        document.getElementById('rateBtn').addEventListener('click', () => this.showSection('rateSection'));
        document.getElementById('reviewsBtn').addEventListener('click', () => this.showSection('reviewsSection'));
        document.getElementById('accountBtn').addEventListener('click', () => this.showSection('accountSection'));
        document.getElementById('adminBtn').addEventListener('click', () => this.showSection('adminSection'));

        // Forms
        document.getElementById('issueForm').addEventListener('submit', (e) => this.handleIssueSubmit(e));
        document.getElementById('ratingForm').addEventListener('submit', (e) => this.handleRatingSubmit(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleAdminLogin(e));
        document.getElementById('userLoginForm').addEventListener('submit', (e) => this.handleUserLogin(e));
        document.getElementById('userRegisterForm').addEventListener('submit', (e) => this.handleUserRegister(e));

        // Reviews filter
        document.getElementById('toolFilter').addEventListener('change', (e) => this.filterReviews(e.target.value));

        // Rating stars
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.setRating(parseInt(e.target.dataset.rating)));
            star.addEventListener('mouseenter', (e) => this.highlightStars(parseInt(e.target.dataset.rating)));
        });

        document.getElementById('overallRating').addEventListener('mouseleave', () => this.highlightStars(this.currentRating));
        
        // Update UI based on login status
        this.updateUIForUserStatus();
    }

    showSection(sectionId) {
        // Check admin access for admin section
        if (sectionId === 'adminSection') {
            if (!this.isAdminLoggedIn) {
                // Check if current user is admin
                if (this.currentUser && this.adminEmails.includes(this.currentUser.email)) {
                    this.isAdminLoggedIn = true;
                    this.showAdminContent();
                    this.updateAdminPanel();
                } else {
                    this.showSection('adminSection'); // Show login form
                    return;
                }
            }
        }

        // Check user login for account section
        if (sectionId === 'accountSection' && this.currentUser) {
            this.showUserProfile();
            return;
        }

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Add active class to corresponding nav button
        const btnMap = {
            'homeSection': 'homeBtn',
            'infoSection': 'infoBtn',
            'reportSection': 'reportBtn',
            'rateSection': 'rateBtn',
            'reviewsSection': 'reviewsBtn',
            'accountSection': 'accountBtn',
            'adminSection': 'adminBtn'
        };
        
        if (btnMap[sectionId]) {
            document.getElementById(btnMap[sectionId]).classList.add('active');
        }

        // Update content based on section
        if (sectionId === 'adminSection' && this.isAdminLoggedIn) {
            this.showAdminContent();
            this.updateAdminPanel();
        } else if (sectionId === 'reviewsSection') {
            this.updatePublicReviews();
        } else if (sectionId === 'adminSection' && !this.isAdminLoggedIn) {
            this.showAdminLogin();
        } else if (sectionId === 'accountSection' && !this.currentUser) {
            this.showAccountLogin();
        }
    }

    handleIssueSubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showNotification('Please login to report an issue', 'error');
            this.showSection('accountSection');
            return;
        }
        
        const issue = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userEmail: this.currentUser.email,
            tool: document.getElementById('toolSelect').value,
            type: document.getElementById('issueType').value,
            title: document.getElementById('issueTitle').value,
            description: document.getElementById('issueDescription').value,
            email: document.getElementById('userEmail').value,
            timestamp: new Date().toISOString(),
            status: 'new'
        };

        this.issues.push(issue);
        this.messages[issue.id] = []; // Initialize messages array for this issue
        this.saveData();
        this.showNotification('Issue submitted successfully!');
        document.getElementById('issueForm').reset();
    }

    handleUserLogin(e) {
        e.preventDefault();
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('apexCurrentUser', JSON.stringify(user));
            this.showNotification('Login successful!');
            this.showUserProfile();
            this.updateUIForUserStatus();
            document.getElementById('userLoginForm').reset();
        } else {
            this.showNotification('Invalid email or password', 'error');
        }
    }

    handleUserRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Email already registered', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password, // In production, this should be hashed
            registeredAt: new Date().toISOString(),
            status: 'active'
        };
        
        this.users.push(newUser);
        this.currentUser = newUser;
        localStorage.setItem('apexUsers', JSON.stringify(this.users));
        localStorage.setItem('apexCurrentUser', JSON.stringify(newUser));
        
        this.showNotification('Account created successfully!');
        this.showUserProfile();
        this.updateUIForUserStatus();
        document.getElementById('userRegisterForm').reset();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('apexCurrentUser');
        this.showNotification('Logged out successfully');
        this.showSection('homeSection');
        this.updateUIForUserStatus();
    }

    showAccountLogin() {
        document.getElementById('accountLogin').style.display = 'block';
        document.getElementById('accountProfile').style.display = 'none';
    }

    showUserProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('accountLogin').style.display = 'none';
        document.getElementById('accountProfile').style.display = 'block';
        
        // Update profile information
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('profileMemberSince').textContent = 
            'Member since: ' + new Date(this.currentUser.registeredAt).toLocaleDateString();
        
        // Update user stats
        const userIssues = this.issues.filter(issue => issue.userId === this.currentUser.id);
        const userRatings = this.ratings.filter(rating => rating.userId === this.currentUser.id);
        
        document.getElementById('userIssuesCount').textContent = userIssues.length;
        document.getElementById('userRatingsCount').textContent = userRatings.length;
        document.getElementById('userStatus').textContent = this.currentUser.status;
        
        // Update avatar
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        if (avatarPlaceholder) {
            avatarPlaceholder.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
    }

    updateUIForUserStatus() {
        const accountBtn = document.getElementById('accountBtn');
        
        if (this.currentUser) {
            accountBtn.textContent = this.currentUser.name;
            accountBtn.style.background = 'rgba(76, 175, 80, 0.2)';
            accountBtn.style.borderColor = 'rgba(76, 175, 80, 0.3)';
        } else {
            accountBtn.textContent = 'Account';
            accountBtn.style.background = '';
            accountBtn.style.borderColor = '';
        }
    }

    showAdminLogin() {
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        
        // Update admin login form to show email requirement
        const loginForm = document.getElementById('loginForm');
        loginForm.innerHTML = `
            <h2>Admin Login</h2>
            <p style="color: #666; margin-bottom: 1rem;">You must be logged in as an admin user to access this panel.</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0; font-size: 0.9rem;">Current admin emails:</p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    ${this.adminEmails.map(email => `<li style="color: #667eea; font-size: 0.9rem;">${email}</li>`).join('')}
                </ul>
            </div>
            <p style="color: #666; font-size: 0.9rem;">Please login with one of the admin emails above, or contact an administrator to be added.</p>
        `;
    }

    showAdminContent() {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
    }

    handleAdminLogin(e) {
        e.preventDefault();
        // This method is no longer needed since we use email-based authentication
        // But keep it for compatibility
        this.showNotification('Please login with your admin email first', 'error');
        this.showSection('accountSection');
    }

    addAdminEmail(email) {
        if (!this.adminEmails.includes(email)) {
            this.adminEmails.push(email);
            localStorage.setItem('apexAdminEmails', JSON.stringify(this.adminEmails));
            this.showNotification(`Admin email added: ${email}`);
            this.updateAdminPanel();
        } else {
            this.showNotification('Email already has admin access', 'error');
        }
    }

    removeAdminEmail(email) {
        // Don't allow removing the last admin
        if (this.adminEmails.length <= 1) {
            this.showNotification('Cannot remove the last admin email', 'error');
            return;
        }
        
        const index = this.adminEmails.indexOf(email);
        if (index > -1) {
            this.adminEmails.splice(index, 1);
            localStorage.setItem('apexAdminEmails', JSON.stringify(this.adminEmails));
            this.showNotification(`Admin email removed: ${email}`);
            this.updateAdminPanel();
        }
    }

    filterIssues(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.updateIssuesList();
    }

    updatePublicReviews() {
        const reviewsList = document.getElementById('publicReviewsList');
        const toolFilter = document.getElementById('toolFilter').value;
        
        let filteredRatings = [...this.ratings];
        
        if (toolFilter) {
            filteredRatings = filteredRatings.filter(rating => rating.tool === toolFilter);
        }
        
        if (filteredRatings.length === 0) {
            reviewsList.innerHTML = '<p>No reviews available for this filter.</p>';
            return;
        }
        
        const sortedRatings = filteredRatings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const isAdmin = this.currentUser && this.adminEmails.includes(this.currentUser.email);
        
        reviewsList.innerHTML = sortedRatings.map(rating => `
            <div class="review-card" data-rating-id="${rating.id}">
                <div class="review-header">
                    <span class="review-tool">${this.getToolName(rating.tool)}</span>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="review-rating">${'★'.repeat(rating.rating)}${'☆'.repeat(5-rating.rating)}</span>
                        ${isAdmin ? `
                            <div class="admin-actions" style="display: flex; gap: 0.5rem;">
                                <button onclick="helpCenter.editRating(${rating.id})" class="admin-btn-edit" style="background: #2196f3; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Edit</button>
                                <button onclick="helpCenter.removeRating(${rating.id})" class="admin-btn-remove" style="background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Remove</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="review-date">${new Date(rating.timestamp).toLocaleDateString()}</div>
                <div class="review-author">
                    <strong>By:</strong> ${this.escapeHtml(rating.userName || 'Anonymous')}
                    ${rating.userEmail ? `(${this.escapeHtml(rating.userEmail)})` : ''}
                </div>
                ${rating.comments ? `<div class="review-comments">"${this.escapeHtml(rating.comments)}"</div>` : ''}
            </div>
        `).join('');
    }

    removeRating(ratingId) {
        if (!this.currentUser || !this.adminEmails.includes(this.currentUser.email)) {
            this.showNotification('Admin access required', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to remove this review? This action cannot be undone.')) {
            const index = this.ratings.findIndex(r => r.id === ratingId);
            if (index > -1) {
                const removedRating = this.ratings[index];
                this.ratings.splice(index, 1);
                this.saveData();
                this.showNotification(`Review by ${removedRating.userName || 'Anonymous'} removed`);
                this.updatePublicReviews();
                this.updateRatingsList(); // Update admin panel too
            }
        }
    }

    editRating(ratingId) {
        if (!this.currentUser || !this.adminEmails.includes(this.currentUser.email)) {
            this.showNotification('Admin access required', 'error');
            return;
        }
        
        const rating = this.ratings.find(r => r.id === ratingId);
        if (!rating) return;
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3 style="color: #667eea; margin-bottom: 1.5rem;">Edit Review</h3>
                <div class="form-group">
                    <label>Rating:</label>
                    <div class="rating-stars-edit" style="display: flex; gap: 0.5rem; font-size: 1.5rem; margin-bottom: 1rem;">
                        ${[1,2,3,4,5].map(star => `
                            <span class="star-edit ${star <= rating.rating ? 'active' : ''}" 
                                  data-rating="${star}" 
                                  style="cursor: pointer; color: ${star <= rating.rating ? '#ffd700' : '#ddd'}; transition: color 0.3s;"
                                  onclick="this.style.color='#ffd700'; document.querySelectorAll('.star-edit').forEach(s => s.classList.remove('active')); this.classList.add('active');">★</span>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="editComments">Comments:</label>
                    <textarea id="editComments" rows="4" style="width: 100%; padding: 0.75rem; border: 2px solid #e1e8ed; border-radius: 8px; resize: vertical;">${rating.comments || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editTool">Tool:</label>
                    <select id="editTool" style="width: 100%; padding: 0.75rem; border: 2px solid #e1e8ed; border-radius: 8px;">
                        <option value="data-analyzer" ${rating.tool === 'data-analyzer' ? 'selected' : ''}>Data Analyzer</option>
                        <option value="report-generator" ${rating.tool === 'report-generator' ? 'selected' : ''}>Report Generator</option>
                        <option value="dashboard" ${rating.tool === 'dashboard' ? 'selected' : ''}>Dashboard</option>
                        <option value="api-client" ${rating.tool === 'api-client' ? 'selected' : ''}>API Client</option>
                    </select>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button onclick="this.closest('.modal-overlay').remove()" style="padding: 0.75rem 1.5rem; background: #9e9e9e; color: white; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>
                    <button onclick="helpCenter.saveRatingEdit(${rating.id})" style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add star rating interaction
        modal.querySelectorAll('.star-edit').forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                modal.querySelectorAll('.star-edit').forEach((s, index) => {
                    s.style.color = index < rating ? '#ffd700' : '#ddd';
                    s.classList.toggle('active', index < rating);
                });
            });
        });
        
        // Close on outside click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    saveRatingEdit(ratingId) {
        const modal = document.querySelector('.modal-overlay');
        if (!modal) return;
        
        const newRating = modal.querySelector('.star-edit.active')?.dataset.rating;
        const newComments = document.getElementById('editComments').value;
        const newTool = document.getElementById('editTool').value;
        
        if (!newRating) {
            this.showNotification('Please select a rating', 'error');
            return;
        }
        
        const rating = this.ratings.find(r => r.id === ratingId);
        if (rating) {
            rating.rating = parseInt(newRating);
            rating.comments = newComments;
            rating.tool = newTool;
            rating.editedBy = this.currentUser.email;
            rating.editedAt = new Date().toISOString();
            
            this.saveData();
            this.showNotification('Review updated successfully');
            this.updatePublicReviews();
            this.updateRatingsList(); // Update admin panel too
            modal.remove();
        }
    }

    filterReviews(tool) {
        this.updatePublicReviews();
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
    }

    handleRatingSubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showNotification('Please login to submit a rating', 'error');
            this.showSection('accountSection');
            return;
        }
        
        if (this.currentRating === 0) {
            this.showNotification('Please select a rating', 'error');
            return;
        }

        const rating = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userEmail: this.currentUser.email,
            tool: document.getElementById('ratingToolSelect').value,
            rating: this.currentRating,
            comments: document.getElementById('ratingComments').value,
            email: document.getElementById('ratingEmail').value,
            timestamp: new Date().toISOString()
        };

        this.ratings.push(rating);
        this.saveData();
        this.showNotification('Rating submitted successfully!');
        document.getElementById('ratingForm').reset();
        this.resetRating();
    }

    highlightStars(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    resetRating() {
        this.currentRating = 0;
        this.highlightStars(0);
    }

    showAdminTab(tabName) {
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Add active class to corresponding button
        event.target.classList.add('active');
        
        // Update tab content
        if (tabName === 'chat') {
            this.updateChatList();
        } else if (tabName === 'users') {
            this.updateUsersList();
        }
    }

    updateUsersList() {
        const usersList = document.getElementById('usersList');
        
        if (this.users.length === 0) {
            usersList.innerHTML = '<p>No users registered yet.</p>';
            return;
        }
        
        const sortedUsers = [...this.users].sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
        
        usersList.innerHTML = `
            <div class="admin-emails-section" style="margin-bottom: 2rem;">
                <h4>Admin Email Management</h4>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="margin: 0 0 1rem 0; font-weight: 600;">Current Admin Emails:</p>
                    <ul style="margin: 0; padding-left: 1.5rem;">
                        ${this.adminEmails.map(email => `
                            <li style="margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                                <span style="color: #667eea;">${email}</span>
                                ${this.adminEmails.length > 1 ? `<button onclick="helpCenter.removeAdminEmail('${email}')" style="background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">Remove</button>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="email" id="newAdminEmail" placeholder="Enter email to add as admin" style="flex: 1; padding: 0.5rem; border: 2px solid #e1e8ed; border-radius: 8px;">
                    <button onclick="helpCenter.addNewAdminEmail()" class="submit-btn" style="padding: 0.5rem 1rem;">Add Admin</button>
                </div>
            </div>
            
            <h4>All Registered Users</h4>
            ${sortedUsers.map(user => `
                <div class="user-item" style="background: #f8f9fa; border: 1px solid #e1e8ed; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h5 style="margin: 0; color: #667eea;">${this.escapeHtml(user.name)}</h5>
                            <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${this.escapeHtml(user.email)}</p>
                            <p style="margin: 0; color: #999; font-size: 0.8rem;">Member since: ${new Date(user.registeredAt).toLocaleDateString()}</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: ${this.adminEmails.includes(user.email) ? '#4caf50' : '#9e9e9e'}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                                ${this.adminEmails.includes(user.email) ? 'ADMIN' : 'USER'}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    addNewAdminEmail() {
        const emailInput = document.getElementById('newAdminEmail');
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showNotification('Please enter an email', 'error');
            return;
        }
        
        if (!email.includes('@')) {
            this.showNotification('Please enter a valid email', 'error');
            return;
        }
        
        this.addAdminEmail(email);
        emailInput.value = '';
    }

    updateChatList() {
        const chatList = document.getElementById('chatList');
        const activeIssues = this.issues.filter(issue => issue.status !== 'resolved');
        
        if (activeIssues.length === 0) {
            chatList.innerHTML = '<p>No active issues to chat about.</p>';
            return;
        }
        
        chatList.innerHTML = activeIssues.map(issue => `
            <div class="chat-item ${this.selectedIssueId === issue.id ? 'active' : ''}" 
                 onclick="helpCenter.selectIssueForChat(${issue.id})">
                <h4>${this.escapeHtml(issue.title)}</h4>
                <div class="issue-meta">
                    <strong>Tool:</strong> ${this.getToolName(issue.tool)} | 
                    <strong>Date:</strong> ${new Date(issue.timestamp).toLocaleDateString()}
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.9rem;">
                    ${this.messages[issue.id] ? this.messages[issue.id].length + ' messages' : 'No messages yet'}
                </div>
            </div>
        `).join('');
    }

    selectIssueForChat(issueId) {
        this.selectedIssueId = issueId;
        this.updateChatList();
        this.showChatMessages(issueId);
    }

    showChatMessages(issueId) {
        const issue = this.issues.find(i => i.id === issueId);
        if (!issue) return;
        
        const messages = this.messages[issueId] || [];
        const chatContainer = document.getElementById('chatList');
        
        chatContainer.innerHTML = `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4>${this.escapeHtml(issue.title)}</h4>
                <div class="issue-meta">
                    <strong>Tool:</strong> ${this.getToolName(issue.tool)} | 
                    <strong>Status:</strong> ${issue.status}
                </div>
            </div>
            
            <div class="chat-messages">
                ${messages.map(msg => `
                    <div class="message ${msg.sender}">
                        <strong>${msg.sender === 'admin' ? 'Admin' : 'User'}:</strong> ${this.escapeHtml(msg.text)}
                        <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
                            ${new Date(msg.timestamp).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="message-form">
                <input type="text" id="messageInput" placeholder="Type your message..." 
                       onkeypress="if(event.key === 'Enter') helpCenter.sendMessage(${issueId})">
                <button onclick="helpCenter.sendMessage(${issueId})">Send</button>
            </div>
            
            <div style="margin-top: 1rem;">
                <button onclick="helpCenter.selectIssueForChat(null)" class="filter-btn">Back to Issues</button>
            </div>
        `;
        
        // Scroll to bottom of messages
        setTimeout(() => {
            const messagesDiv = chatContainer.querySelector('.chat-messages');
            if (messagesDiv) {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }, 100);
    }

    sendMessage(issueId) {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        if (!this.messages[issueId]) {
            this.messages[issueId] = [];
        }
        
        this.messages[issueId].push({
            sender: 'admin',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        this.saveData();
        input.value = '';
        this.showChatMessages(issueId);
        this.showNotification('Message sent!');
    }

    updateAdminPanel() {
        this.updateIssuesList();
        this.updateRatingsList();
    }

    updateIssuesList() {
        const issuesList = document.getElementById('issuesList');
        
        let filteredIssues = [...this.issues];
        
        // Apply filter
        if (this.currentFilter === 'new') {
            filteredIssues = filteredIssues.filter(issue => issue.status === 'new');
        } else if (this.currentFilter === 'resolved') {
            filteredIssues = filteredIssues.filter(issue => issue.status === 'resolved');
        }
        
        if (filteredIssues.length === 0) {
            issuesList.innerHTML = '<p>No issues found for this filter.</p>';
            return;
        }

        const sortedIssues = filteredIssues.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        issuesList.innerHTML = sortedIssues.map(issue => `
            <div class="issue-item">
                <h4>${this.escapeHtml(issue.title)}</h4>
                <div class="issue-meta">
                    <strong>Tool:</strong> ${this.getToolName(issue.tool)} | 
                    <strong>Type:</strong> ${this.getIssueTypeName(issue.type)} | 
                    <strong>Status:</strong> <span style="color: ${issue.status === 'resolved' ? '#4caf50' : '#ff9800'}">${issue.status}</span> |
                    <strong>Date:</strong> ${new Date(issue.timestamp).toLocaleString()}
                    ${issue.email ? ` | <strong>Email:</strong> ${this.escapeHtml(issue.email)}` : ''}
                </div>
                <div class="issue-description">
                    ${this.escapeHtml(issue.description)}
                </div>
                <div style="margin-top: 1rem;">
                    ${issue.status !== 'resolved' ? `
                        <button onclick="helpCenter.markIssueResolved(${issue.id})" class="submit-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-right: 0.5rem;">
                            Mark as Resolved
                        </button>
                    ` : ''}
                    <button onclick="helpCenter.selectIssueForChat(${issue.id})" class="filter-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        Chat (${this.messages[issue.id] ? this.messages[issue.id].length : 0} messages)
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateRatingsList() {
        const ratingsList = document.getElementById('ratingsList');
        
        if (this.ratings.length === 0) {
            ratingsList.innerHTML = '<p>No ratings submitted yet.</p>';
            return;
        }

        const sortedRatings = [...this.ratings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        ratingsList.innerHTML = sortedRatings.map(rating => `
            <div class="rating-item">
                <h4>${this.getToolName(rating.tool)} - ${'★'.repeat(rating.rating)}${'☆'.repeat(5-rating.rating)}</h4>
                <div class="rating-meta">
                    <strong>Rating:</strong> ${rating.rating}/5 | 
                    <strong>Date:</strong> ${new Date(rating.timestamp).toLocaleString()}
                    ${rating.email ? ` | <strong>Email:</strong> ${this.escapeHtml(rating.email)}` : ''}
                </div>
                ${rating.comments ? `
                    <div class="rating-comments">
                        ${this.escapeHtml(rating.comments)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    markIssueResolved(issueId) {
        const issue = this.issues.find(i => i.id === issueId);
        if (issue) {
            issue.status = 'resolved';
            this.saveData();
            this.updateIssuesList();
            this.showNotification('Issue marked as resolved');
        }
    }

    getToolName(toolId) {
        const tools = {
            'data-analyzer': 'Data Analyzer',
            'report-generator': 'Report Generator',
            'dashboard': 'Dashboard',
            'api-client': 'API Client',
            'other': 'Other'
        };
        return tools[toolId] || toolId;
    }

    getIssueTypeName(typeId) {
        const types = {
            'bug': 'Bug/Error',
            'performance': 'Performance Issue',
            'ui': 'UI/UX Problem',
            'feature': 'Feature Request',
            'other': 'Other'
        };
        return types[typeId] || typeId;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    saveData() {
        localStorage.setItem('apexIssues', JSON.stringify(this.issues));
        localStorage.setItem('apexRatings', JSON.stringify(this.ratings));
        localStorage.setItem('apexMessages', JSON.stringify(this.messages));
        localStorage.setItem('apexUsers', JSON.stringify(this.users));
        localStorage.setItem('apexAdminEmails', JSON.stringify(this.adminEmails));
    }
}

// Global functions for inline event handlers
function showSection(sectionId) {
    helpCenter.showSection(sectionId);
}

function showAdminTab(tabName) {
    helpCenter.showAdminTab(tabName);
}

function showInfoTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.info-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.info-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to corresponding button
    event.target.classList.add('active');
}

function showAccountTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.account-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.account-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to corresponding button
    event.target.classList.add('active');
}

// Initialize the application
const helpCenter = new ApexDataHelpCenter();
