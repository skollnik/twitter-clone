let cropper;
let timer;
const selectedUsers = [];

$(document).ready(() => {
    refreshMessagesBadge();
    refreshNotificationsBadge();
})

$('#postTextarea, #replyTextarea').keyup(event => {
    const textbox = $(event.target);
    const value = textbox.val().trim();
    const isModal = textbox.parents('.modal').length == 1;

    const submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if (submitButton.length == 0) return alert('No submit button found.');

    if (value == '') {
        submitButton.prop('disabled', true);
        return;
    }
    submitButton.prop('disabled', false);
});

$('#submitPostButton, #submitReplyButton').click(event => {
    const button = $(event.target);
    const isModal = button.parents('.modal').length == 1;
    const textbox = isModal ? $('#replyTextarea') : $('#postTextarea');
    const data = {
        content: textbox.val(),
    };
    if (isModal) {
        const id = button.data().id;
        if (id == null) return alert('Button id is null');
        data.replyTo = id;
    }

    $.post('/api/posts', data, postData => {
        if (postData.replyTo) {
            emitNotification(postData.replyTo.postedBy);
            location.reload();
        } else {
            const html = createPostHtml(postData);
            $('.postsContainer').prepend(html);
            textbox.val('');
            button.prop('disabled', true);
        }
    });
});

$('#replyModal').on('show.bs.modal', event => {
    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $('#submitReplyButton').data('id', postId);

    $.get(`/api/posts/${postId}`, results => {
        outputPosts(results.postData, $('#origianlPostContainer'));
    });
});

$('#replyModal').on('hidden.bs.modal', () => {
    $('#origianlPostContainer').html('');
});

$('#deletePostModal').on('show.bs.modal', event => {
    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $('#deletePostButton').data('id', postId);
});

$('#deletePostButton').click((event) => {
    const postId = $(event.target).data('id');

    $.ajax({
        url: `/api/posts/${postId}`,
        type: 'DELETE',
        success: () => {
            location.reload();
        }
    });
});

$('#confirmPinModal').on('show.bs.modal', event => {
    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $('#pinPostButton').data('id', postId);
});

$('#pinPostButton').click((event) => {
    const postId = $(event.target).data('id');

    $.ajax({
        url: `/api/posts/${postId}`,
        type: 'PUT',
        data: { pinned: true },
        success: () => {
            location.reload();
        }
    });
});

$('#unpinModal').on('show.bs.modal', event => {
    const button = $(event.relatedTarget);
    const postId = getPostIdFromElement(button);
    $('#unpinPostButton').data('id', postId);
});

$('#unpinPostButton').click((event) => {
    const postId = $(event.target).data('id');

    $.ajax({
        url: `/api/posts/${postId}`,
        type: 'PUT',
        data: { pinned: false },
        success: () => {
            location.reload();
        }
    });
});

$('#filePhoto').change(function () {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = document.getElementById('imagePreview');
            image.src = e.target.result;

            if (cropper !== undefined) {
                cropper.destroy();
            }
            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false
            });
        };
        reader.readAsDataURL(this.files[0]);
    }
});

$('#coverPhoto').change(function () {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = document.getElementById('coverPreview');
            image.src = e.target.result;

            if (cropper !== undefined) {
                cropper.destroy();
            }
            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false
            });
        };
        reader.readAsDataURL(this.files[0]);
    }
});

$('#imageUploadButton').click(() => {
    const canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert('Could not upload image. Make sure it is an image file.');
        return;
    }
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('croppedImage', blob);

        $.ajax({
            url: '/api/users/profilePicture',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }
        });
    });
});

$('#coverPhotoButton').click(() => {
    const canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert('Could not upload image. Make sure it is an image file.');
        return;
    }
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('croppedImage', blob);

        $.ajax({
            url: '/api/users/coverPhoto',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }
        });
    });
});

$('#replyModal').on('hidden.bs.modal', () => {
    $('#origianlPostContainer').html('');
});

$('#userSearchTextbox').keydown((event) => {
    clearTimeout(timer);
    const textbox = $(event.target);
    let value = textbox.val();

    if (value == '' && (event.whitch == 8 || event.keyCode == 8)) {
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $('.resultsContainer').html('');
        if (selectedUsers.length == 0) {
            $('#createChatButton').prop('disabled', true);
        }
        return;
    }

    timer = setTimeout(() => {
        value = textbox.val().trim();

        if (value == '') {
            $('.resultsContainer').html('');
        } else {
            searchUsers(value);
        }
    }, 1000);
});

$('#createChatButton').click(() => {
    const data = JSON.stringify(selectedUsers);

    $.post('/api/chats', { users: data }, (chat) => {
        if (!chat || !chat._id) return alert('Invalid response from server.');
        window.location.href = `/messages/${chat._id}`;
    })
});

$(document).on('click', '.likeButton', event => {
    const button = $(event.target);
    const postId = getPostIdFromElement(button);
    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: 'PUT',
        success: (postData) => {
            button.find('span').text(postData.likes.length || '');
            if (postData.likes.includes(userLoggedIn._id)) {
                button.addClass('active');
                emitNotification(postData.postedBy);
            } else {
                button.removeClass('active');
            }
        }
    });
});

$(document).on('click', '.retweetButton', event => {
    const button = $(event.target);
    const postId = getPostIdFromElement(button);
    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: 'POST',
        success: (postData) => {
            button.find('span').text(postData.retweetUsers.length || '');
            if (postData.retweetUsers.includes(userLoggedIn._id)) {
                button.addClass('active');
                emitNotification(postData.postedBy);
            } else {
                button.removeClass('active');
            }
        }
    });
});

$(document).on('click', '.post', event => {
    const element = $(event.target);
    const postId = getPostIdFromElement(element);
    if (postId !== undefined && !element.is('button')) {
        window.location.href = `/posts/${postId}`;
    }
});

$(document).on('click', '.followButton', event => {
    const button = $(event.target);
    const userId = button.data().user;

    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: 'PUT',
        success: (data, status, xhr) => {
            if (xhr.status == 404) {
                return;
            }

            let difference = 1;

            if (data.following && data.following.includes(userId)) {
                button.addClass('following');
                button.text('Following');
                emitNotification(userId);
            } else {
                button.removeClass('following');
                button.text('Follow');
                difference = -1;
            }
            const followersLabel = $('#followersValue');
            if (followersLabel.length != 0) {
                let followersText = followersLabel.text();
                followersText = parseInt(followersText);
                followersLabel.text(followersText + difference);
            }
        }
    });
});

$(document).on('click', '.notification.active', event => {
    const container = $(event.target);
    const notificationId = container.data().id;
    const href = container.attr('href');
    event.preventDefault();

    const callback = () => window.location = href;
    markNotificationsAsOpened(notificationId, callback);
});

function getPostIdFromElement(element) {
    const isRoot = element.hasClass('post');
    const rootElement = isRoot ? element : element.closest('.post');
    const postId = rootElement.data().id;
    if (postId === undefined) return alert('Post id undefined');
    return postId;
}

function createPostHtml(postData, largeFont = false) {
    if (postData == null) return alert('Post object is null');
    const isRetweet = postData.retweetData !== undefined;
    const retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData : postData;
    const postedBy = postData.postedBy;
    if (postedBy._id === undefined) {
        return console.log('User object not populated');
    }
    const displayName = postedBy.firstName + ' ' + postedBy.lastName;
    const timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? 'active' : '';
    const retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? 'active' : '';
    const largeFontClass = largeFont ? 'largeFont' : '';

    let retweetText = '';
    if (isRetweet) {
        retweetText = `<span>
                            <i class="fas fa-retweet"></i>
                            Retweeted by <a href="/profile/${retweetedBy}">@${retweetedBy}</a>
                       </span>`;
    }

    let replyFlag = '';
    if (postData.replyTo && postData.replyTo._id) {
        if (!postData.replyTo._id) {
            return alert('Reply to is not populated');
        } else if (!postData.replyTo.postedBy._id) {
            return alert('Posted by is not populated');
        }

        const replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class="replyFlag">
                        Replaying to <a href="/profile/${replyToUsername}">@${replyToUsername}</a>
                     </div>`
    }

    let buttons = '';
    let pinnedPostText = '';
    if (postData.postedBy._id == userLoggedIn._id) {
        let pinnedClass = '';
        let dataTarget = '#confirmPinModal';
        if (postData.pinned === true) {
            pinnedClass = 'active';
            dataTarget = '#unpinModal';
            pinnedPostText = '<i class="fas fa-thumbtack"></i> <span>Pinned post</span>';
        }

        buttons = `<button class="pinButton ${pinnedClass}" data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}">
                        <i class="fas fa-thumbtack"></i>
                   </button>
                   <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal">
                        <i class="fas fa-times"></i>
                   </button>`;
    }

    return `<div class="post ${largeFontClass}" data-id="${postData._id}">
                <div class="postActionContainer">
                    ${retweetText}
                </div>
                <div class="mainContentContainer">
                    <div class="userImageContainer">
                        <img src="${postedBy.profilePic}">
                    </div>
                    <div class="postContentContainer">
                        <div class="pinnedPostText">${pinnedPostText}</div>
                        <div class="postHeader">
                            <a href="/profile/${postedBy.username}" class="displayName">${displayName}</a>
                            <span class="username">@${postedBy.username}</span>
                            <span class="date">${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class="postBody">
                            <span>${postData.content}</span>
                        </div>
                        <div class="postFooter">
                            <div class="postButtonContainer">
                                <button data-toggle="modal" data-target="#replyModal">
                                    <i class="far fa-comment"></i>
                                </button>
                            </div>
                            <div class="postButtonContainer retweeted">
                                <button class="retweetButton ${retweetButtonActiveClass}">
                                    <i class="fas fa-retweet"></i>
                                    <span>${postData.retweetUsers.length || ''}</span>
                                </button>
                            </div>
                            <div class="postButtonContainer liked">
                                <button class="likeButton ${likeButtonActiveClass}">
                                    <i class="far fa-heart"></i>
                                    <span>${postData.likes.length || ''}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function timeDifference(current, previous) {

    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if (elapsed / 1000 < 30) return 'Just now';
        return Math.round(elapsed / 1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + ' months ago';
    }

    else {
        return Math.round(elapsed / msPerYear) + ' years ago';
    }
}

function outputPosts(results, container) {
    container.html('');
    if (!Array.isArray(results)) {
        results = [results];
    }
    results.forEach(result => {
        const html = createPostHtml(result);
        container.append(html);
    });
    if (results.length == 0) {
        container.append('<span class="noResults">Nothing to show.</span>')
    }
}

function outputPostsWithReplies(results, container) {
    container.html('');

    if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
        const html = createPostHtml(results.replyTo);
        container.append(html);
    }

    const mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach(result => {
        const html = createPostHtml(result);
        container.append(html);
    });
}

function outputUsers(results, container) {
    container.html('');
    results.forEach(result => {
        const html = createUserHtml(result, true);
        container.append(html);
    });

    if (results.length == 0) {
        container.append('<span class="noResults">No results found</span>');
    }
}

function createUserHtml(userData, showFollowButton) {
    const name = userData.firstName + ' ' + userData.lastName;
    const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    const text = isFollowing ? 'Following' : 'Follow';
    const buttonClass = isFollowing ? 'followButton following' : 'followButton';
    let followButton = '';

    if (showFollowButton && userLoggedIn._id !== userData._id) {
        followButton = `<div class="followButtonContainer">
                            <button class="${buttonClass}" data-user="${userData._id}">${text}</button>
                        </div>`
    }

    return `<div class="user">
                <div class="userImageContainer">
                    <img src="${userData.profilePic}">
                </div>
                <div class="userDetailsContainer">
                    <div class="header">
                        <a href="/profile/${userData.username}">${name}</a>
                        <span class="username">@${userData.username}</span>
                    </div>
                </div>
                ${followButton}
            </div>`
}

function searchUsers(searchTerm) {
    $.get('/api/users', { search: searchTerm }, (results) => {
        outputSelectableUsers(results, $('.resultsContainer'));
    });
}

function outputSelectableUsers(results, container) {
    container.html('');
    results.forEach(result => {
        if (result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
            return;
        }

        const html = createUserHtml(result, false);
        const element = $(html);

        element.click(() => userSelected(result));
        container.append(element);
    });

    if (results.length == 0) {
        container.append('<span class="noResults">No results found</span>');
    }
}

function userSelected(user) {
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $('#userSearchTextbox').val('').focus();
    $('.resultsContainer').html('');
    $('#createChatButton').prop('disabled', false);
}

function updateSelectedUsersHtml() {
    const elements = [];

    selectedUsers.forEach(user => {
        const name = user.firstName + ' ' + user.lastName;
        const userElement = $(`<span class="selectedUser">${name}</span>`);
        elements.push(userElement);
    });
    $('.selectedUser').remove();
    $('#selectedUsers').prepend(elements);
}

function getChatName(chatData) {
    let chatName = chatData.chatName;

    if (!chatName) {
        const otherChatUsers = getOtherChatUsers(chatData.users);
        const namesArray = otherChatUsers.map(user => user.firstName + ' ' + user.lastName);
        chatName = namesArray.join(', ');
    }
    return chatName;
}

function getOtherChatUsers(users) {
    if (users.length == 1) return users;
    return users.filter(user => user._id != userLoggedIn._id);
}

function messageReceived(newMessage) {
    if ($(`[data-room="${newMessage.chat._id}"]`)[0]) {
        addChatMessageHtml(newMessage);
    } else {
        showMessagePopup(newMessage);
    }

    refreshMessagesBadge();
}

function markNotificationsAsOpened(notificationId = null, callback = null) {
    if (callback == null) callback = () => location.reload();

    const url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : `/api/notifications/markAsOpened`;
    $.ajax({
        url,
        type: 'PUT',
        success: () => {
            callback();
        }
    });
}

function refreshMessagesBadge() {
    $.get('/api/chats', { unreadOnly: true }, (data) => {
        const numResults = data.length;
        if (numResults > 0) {
            $('#messagesBadge').text(numResults).addClass('active');
        } else {
            $('#messagesBadge').text('').removeClass('active');
        }
    });
}

function refreshNotificationsBadge() {
    $.get('/api/notifications', { unreadOnly: true }, (data) => {
        const numResults = data.length;
        if (numResults > 0) {
            $('#notificationBadge').text(numResults).addClass('active');
        } else {
            $('#notificationBadge').text('').removeClass('active');
        }
    });
}

function showNotificationPopup(data) {
    const html = createNotificationHtml(data);
    const element = $(html);
    element.hide().prependTo('#notificationList').slideDown('fast');

    setTimeout(() => {
        element.fadeOut(400)
    }, 5000);
}

function showMessagePopup(data) {
    if (!data.chat.latestMessage._id) {
        data.chat.latestMessage = data;
    }

    const html = createChatHtml(data.chat);
    const element = $(html);
    element.hide().prependTo('#notificationList').slideDown('fast');

    setTimeout(() => {
        element.fadeOut(400)
    }, 5000);
}

function outputNotificationList(notifications, container) {
    notifications.forEach(notification => {
        const html = createNotificationHtml(notification);
        container.append(html);
    });

    if (notifications.length == 0) {
        container.append('<span class="noResults">Nothing to show.</span>');
    }
}

function createNotificationHtml(notification) {
    const userFrom = notification.userFrom;
    const text = getNotificationText(notification);
    const href = getNotificationUrl(notification);
    const className = notification.opened ? "" : "active";

    return `<a href="${href}" class="resultListItem notification ${className}" data-id="${notification._id}">
                <div class="resultsImageContainer">
                    <img src="${userFrom.profilePic}">
                </div>
                <div class="resultsDetailsContainer ellipsis">
                    <span class="ellipsis">${text}</span>
                </div>
            </a>`
}

function getNotificationText(notification) {
    const userFrom = notification.userFrom;

    if (!userFrom.firstName || !userFrom.lastName) {
        return alert('User from data not populated.');
    }

    const userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    let text;

    if (notification.notificationType == 'retweet') {
        text = `${userFromName} retweeted one of your posts.`;
    } else if (notification.notificationType == 'like') {
        text = `${userFromName} liked one of your posts.`;
    } else if (notification.notificationType == 'reply') {
        text = `${userFromName} replied to one of your posts.`;
    } else if (notification.notificationType == 'follow') {
        text = `${userFromName} followed you.`;
    }

    return `<span class="ellipsis">${text}</span>`;
}

function getNotificationUrl(notification) {
    let url = '#';

    if (notification.notificationType == 'retweet' || notification.notificationType == 'like' || notification.notificationType == 'reply') {
        url = `/posts/${notification.entityId}`;
    } else if (notification.notificationType == 'follow') {
        url = `/profile/${notification.entityId}`;
    }

    return url;
}

function createChatHtml(chatData) {
    const chatName = getChatName(chatData);
    const image = getChatImageElements(chatData);
    const latestMessage = getLatestMessage(chatData.latestMessage);
    const activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? '' : 'active';
    return `<a href="/messages/${chatData._id}" class="resultListItem ${activeClass}">
                ${image}
                <div class="resultsDetailsContainer ellipsis">
                    <span class="heading ellipsis">${chatName}</span>
                    <span class="subText ellipsis">${latestMessage}</span>
                </div>
            </a>`;
}

function getLatestMessage(latestMessage) {
    if (latestMessage != null) {
        const sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return 'New chat';
}

function getChatImageElements(chatData) {
    const otherChatUsers = getOtherChatUsers(chatData.users);
    let groupChatClass = '';
    let chatImage = getUserChatImageElement(otherChatUsers[0]);

    if (otherChatUsers.length > 1) {
        groupChatClass = 'groupChatImage';
        chatImage += getUserChatImageElement(otherChatUsers[1])
    }
    return `<div class="resultsImageContainer ${groupChatClass}">
                ${chatImage}
            </div>`
}

function getUserChatImageElement(user) {
    if (!user || !user.profilePic) {
        return alert('User passed into function is invalid.');
    }

    return `<img src="${user.profilePic}" alt="User's profile pic">`
}