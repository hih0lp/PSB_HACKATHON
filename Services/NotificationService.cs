using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using PSB_HACKATHON.Models;
using PSB_HACKATHON.NotificationHub;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace PSB_HACKATHON.Services
{
    public class NotificationService
    {
        private readonly IHubContext<NotificationsHub> _hubContext;
        private readonly DB _db;
        private readonly ConcurrentDictionary<string, List<NotificationModel>> _pendingNotifications = new();
        private readonly ILogger<NotificationService> _logger;
        private readonly IConfiguration _config;
        public NotificationService(IHubContext<NotificationsHub> hubContext, ILogger<NotificationService> logger, DB db, IConfiguration configuration)
        {
            _hubContext = hubContext;
            _logger = logger;
            _db = db;
            _config = configuration;
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

        private HttpContent CreateContentWithURI(string message, string redirectURI)
        {
            var notificationJSON = JsonSerializer.Serialize(new
            {
                NotificationMessage = message,
                RedirectUri = redirectURI
            }); //Here you need to insert a link to receive the project

            var content = new StringContent(notificationJSON, Encoding.UTF8, "application/json");
            var serviceKey = _config["NotificationService"];
            content.Headers.Add("X-KEY", serviceKey);

            return content;
        }

        private HttpContent CreateContentWithoutURI(string message)
        {
            var notificationJSON = JsonSerializer.Serialize(new
            {
                NotificationMessage = message,
            }); //Here you need to insert a link to receive the project

            var content = new StringContent(notificationJSON, Encoding.UTF8, "application/json");
            var serviceKey = _config["NotificationService"];
            content.Headers.Add("X-KEY", serviceKey);

            return content;
        }
    }
}
