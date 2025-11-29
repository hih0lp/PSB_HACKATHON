using ERP_Proflipper_NotificationService.Filters;
using ERP_Proflipper_NotificationService.Hubs;
using ERP_Proflipper_NotificationService.Models;
using ERP_Proflipper_NotificationService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace ERP_Proflipper_NotificationService.Controllers
{
    public class NotificationController : Controller
    {
        private readonly ILogger<NotificationController> _logger;
        private readonly NotificationService _notificationService;
        private readonly IHubContext<NotificationsHub> _hubContext;
        private readonly DB _db;

        public NotificationController(ILogger<NotificationController> logger, IHubContext<NotificationsHub> hubContext, NotificationService notificationService, DB db)
        {
            _logger = logger;
            _hubContext = hubContext;
            _notificationService = notificationService;
            _db = db;
        }

        [HttpPost("user/{userLogin}")]
        [ServiceKeyAuthAttribute]
        public async Task<IActionResult> SendToUser(string userLogin, [FromBody]NotificationModel request)//дождаться егорика
        {

            await _notificationService.SendNotificationsAsync(userLogin, request);

            return Ok();    
        }

        [HttpGet("user/{userLogin}")]
        public async Task<JsonResult> GetNotifications(string userLogin)
        {
            return Json(_db.Notifications
                            .Where(x => x.UserLogin == userLogin)
                            .Where(x => x.IsSent)
                            .OrderBy(x => x.CreatedAt)
                            .ToList());
        }

        [HttpDelete("notifications/{notificationId}")]
        public async Task<StatusCodeResult> DeleteNotifications(int notificationId)
        {
            var notification = _db.Notifications.FirstOrDefault(x => x.Id == notificationId);
            _db.Notifications.Remove(notification);
            _db.SaveChanges();

            return Ok();
        }
    }
}
