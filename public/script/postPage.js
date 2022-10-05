$(document).ready(() => {
    $.get(`/api/posts/${postId}`, results => {
        outputPostsWithReplies(results, $('.postsContainer'));

        $('.loadingSpinnerContainer').remove();
        $('.postsContainer').css('visibility', 'visible');
    });
});