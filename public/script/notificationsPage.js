$(document).ready(() => {
    $.get('/api/notifications', (data) => {
        outputNotificationList(data, $('.resultsContainer'));

        $('.loadingSpinnerContainer').remove();
        $('.resultsContainer').css('visibility', 'visible');
    });
});

$('#markNotificationsAsRead').click(() => markNotificationsAsOpened())