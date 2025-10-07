import '../../assets/app.js';
import { initAuthUI, requireAuth, fetchUserProfile, saveUserProfile, getCurrentUser } from '../../assets/auth.js';

const elements = {};

function bindElements() {
    elements.roleRelation = document.getElementById('profile-roleRelation');
    elements.superPower = document.getElementById('profile-superPower');
    elements.avatarProfile = document.getElementById('profile-avatarProfile');
    elements.saveButton = document.getElementById('profile-save');
    elements.status = document.getElementById('profile-status');
    elements.loginButton = document.getElementById('profile-login');
    elements.logoutButton = document.getElementById('profile-logout');
    elements.userInfo = document.getElementById('profile-user-info');
}

function setFormDisabled(disabled) {
    const inputs = [elements.roleRelation, elements.superPower, elements.avatarProfile, elements.saveButton];
    inputs.forEach((el) => {
        if (el) el.disabled = disabled;
    });
}

function setStatus(message, variant = 'info') {
    if (!elements.status) return;
    const colors = {
        info: 'text-white/60',
        success: 'text-green-400',
        error: 'text-red-400'
    };
    elements.status.className = `text-center text-sm ${colors[variant] || colors.info}`;
    elements.status.textContent = message;
}

function fillForm(profile) {
    if (!profile) return;
    elements.roleRelation.value = profile.roleRelation || '';
    elements.superPower.value = profile.superPower || '';
    elements.avatarProfile.value = profile.avatarProfile || '';
}

async function loadProfile(uid) {
    setStatus('正在加载角色信息...', 'info');
    setFormDisabled(true);
    try {
        const data = await fetchUserProfile(uid);
        if (data) fillForm(data);
        setStatus('');
    } catch (error) {
        console.error('加载角色信息失败:', error);
        setStatus('加载失败，请稍后再试', 'error');
    } finally {
        setFormDisabled(false);
    }
}

async function handleSave() {
    const user = getCurrentUser();
    if (!user) {
        setStatus('请先登录', 'error');
        return;
    }

    const payload = {
        roleRelation: elements.roleRelation.value.trim() || null,
        superPower: elements.superPower.value.trim() || null,
        avatarProfile: elements.avatarProfile.value.trim() || null
    };

    setStatus('保存中...', 'info');
    setFormDisabled(true);

    try {
        await saveUserProfile(user.uid, payload);
        setStatus('保存成功！', 'success');
    } catch (error) {
        console.error('保存角色信息失败:', error);
        setStatus('保存失败，请稍后再试', 'error');
    } finally {
        setFormDisabled(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindElements();

    initAuthUI({
        loginButton: elements.loginButton,
        logoutButton: elements.logoutButton,
        userInfoContainer: elements.userInfo
    });

    if (elements.saveButton) {
        elements.saveButton.addEventListener('click', handleSave);
    }

    requireAuth((user) => {
        if (user) {
            loadProfile(user.uid);
            setFormDisabled(false);
        } else {
            if (elements.roleRelation) elements.roleRelation.value = '';
            if (elements.superPower) elements.superPower.value = '';
            if (elements.avatarProfile) elements.avatarProfile.value = '';
            setFormDisabled(true);
            setStatus('登录后可编辑角色信息', 'info');
        }
    });
});
