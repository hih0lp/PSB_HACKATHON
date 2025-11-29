using ERP_Proflipper_NotificationService.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using System.Collections.Concurrent;

namespace ERP_Proflipper_NotificationService.Hubs
{
    public class NotificationsHub : Hub
    {
        //private readonly ILogger<NotificationsHub> logger;
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private readonly IServiceProvider _provider;
        private readonly ILogger<NotificationsHub> _logger;

        public NotificationsHub(IServiceProvider provider, ILogger<NotificationsHub> logger)
        {
            _provider = provider;
            _logger = logger;
        }

        public async Task ClientRegister(string userLogin) //add check-in existence user connection
        {
            _userConnections[userLogin] = Context.ConnectionId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userLogin}");

            using (var scope = _provider.CreateScope())
            {
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                await notificationService.SendPendingNotificationAsync(userLogin);
                _logger.LogInformation("Pending notifications has been sending");

            }

        }

        //public override async Task OnConnectedAsync()
        //{
        //    await base.OnConnectedAsync();
        //}

        public static bool IsUserOnline(string userLogin)
        {
            return _userConnections.ContainsKey(userLogin);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userLogin = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;

            if (userLogin is not null)
            {
                _userConnections.TryRemove(userLogin, out _);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userLogin}");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
