using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using PSB_HACKATHON.NotificationHub;
using PSB_HACKATHON.Models;
using System.Collections.Concurrent;

namespace PSB_HACKATHON.Services
{
    public class NotificationService
    {
        private readonly IHubContext<NotificationsHub> _hubContext;
        private readonly DB _db;
        private readonly ConcurrentDictionary<string, List<NotificationModel>> _pendingNotifications = new();
        private readonly ILogger<NotificationService> _logger;
        public NotificationService(IHubContext<NotificationsHub> hubContext, ILogger<NotificationService> logger, DB db)
        {
            _hubContext = hubContext;
            _logger = logger;
            _db = db;
        }

        public async Task SendNotificationsAsync(string userLogin, NotificationModel notification)
        {
            notification.CreatedAt = DateTime.UtcNow.ToUniversalTime();
            notification.UserLogin = userLogin;

            _db.Notifications.Add(notification);
            _db.SaveChanges();


            //check if user is online
            bool isUserOnline = await TrySendWebSocketAsync(userLogin, notification);

            //add a notification to pendings to send it when user will be online
            if (!isUserOnline)
            {
                _logger.LogInformation("Notifications in pendings");
                AddToPending(notification);
            }
        }

        //try send notifications
        public async Task<bool> TrySendWebSocketAsync(string userLogin, NotificationModel notification)
        {
            if (NotificationsHub.IsUserOnline(userLogin))//check user online
            {
                //if (notification.SendingAt >= DateTime.Now) //if notification will publish soon retun false to show that the user is offline
                //{
                //    return false;
                //}

                await _hubContext.Clients.Group($"user_{userLogin}").SendAsync("ReceiveNotification", notification);

                notification.IsSent = true;
                await _db.SaveChangesAsync();

                _logger.LogInformation("Notification's sending successfully");

                return true;
            }
            return false;
        }

        public async void AddToPending(NotificationModel notification)
        {
            _db.Notifications.Add(notification);
            _logger.LogInformation($"Pending, {DateTime.UtcNow}");
        }

        public async Task SendPendingNotificationAsync(string userLogin)
        {
            var pendingNotifications = _db.Notifications
                .Where(x => x.UserLogin == userLogin)
                .Where(x => !x.IsSent)
                //.Where(x => x.SendingAt <= DateTime.Now) //sending when time came
                .OrderBy(x => x.CreatedAt)
                .ToList();

            _logger.LogInformation("Pending notifications has been sending");

            if (pendingNotifications.Count != 0)
            {
                foreach (var notification in pendingNotifications)
                {
                    await _hubContext.Clients.Group($"user_{userLogin}").SendAsync("ReceiveNotification", notification); 
                    notification.IsSent = true; 
                }
                await _db.SaveChangesAsync();
            }
        }
    }
}
