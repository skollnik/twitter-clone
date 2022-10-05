$(document).ready(() => {
    if (selectedTab === 'replies') {
        loadReplies();
    } else {
        loadPosts();
    }
});

function loadPosts() {
    $.get('/api/posts', { postedBy: profileUserId, pinned: true }, results => {
        outputPinnedPost(results, $('.pinnedPostContainer'));
        $('.loadingSpinnerContainer').remove();
        $('.postsContainer').css('visibility', 'visible');
    });
    
    $.get('/api/posts', { postedBy: profileUserId, isReply: false }, results => {
        outputPosts(results, $('.postsContainer'));
    });
}

function loadReplies() {
    $.get('/api/posts', { postedBy: profileUserId, isReply: true }, results => {
        outputPosts(results, $('.postsContainer'));
        $('.loadingSpinnerContainer').remove();
        $('.postsContainer').css('visibility', 'visible');
    });
}

function outputPinnedPost(results, container) {
    if(results.length == 0) {
        container.hide();
        return;
    }
    container.html('');
    results.forEach(result => {
        const html = createPostHtml(result);
        container.append(html);
    });
}