using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Controllers;
using PSB_HACKATHON.Models;
using PSB_HACKATHON.Services;

namespace PSB_HACKATHON.Controllers
{
    public class AdminController : Controller
    {
        private readonly DB _db;
        private readonly NotificationService _notification;
        private ILogger<AdminController> _logger;

        public AdminController(DB db, NotificationService notification, ILogger<AdminController> logger)
        {
            _db = db;
            _notification = notification;
            _logger = logger;
        }

        [HttpGet]
        [Route("Admin/GetUsers")]
        public async Task<IActionResult> GetUsers(int userId)
        {
            try
            {
                if (await _db.Users.AnyAsync(u => u.Id == userId) == null) { return BadRequest("Пользователь не существует"); }
                var userRole = await _db.Users
                    .Where(u => u.Id == userId)
                    .Select(u => u.Role)
                    .FirstOrDefaultAsync();
                if (userRole != "admin") { return Unauthorized("Недостаточно прав"); }

                var students = await _db.Users
                    .Where(u => u.Role == "student")
                    .Select(u => new
                    {
                        u.Id,
                        u.Login,
                        u.Email
                    })
                    .ToListAsync();
                return Ok(students);

            }
            catch (Exception ex)
            {
                _logger.LogError($"Не удалось вернуть пользователей");
                return StatusCode(500, $"Не удалось вернуть пользователей\n{ex}");
            }
        }

        [HttpPut]
        [Route("Admin/ChangeRole")]
        public async Task<IActionResult> ChangeRole(int userId, int adminId, string role)
        {
            try
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                var admin = await _db.Users.FirstOrDefaultAsync(u =>u.Id == adminId);
                if (admin.Role != "admin") { return Unauthorized("Недостаточно прав"); }
                if (user == null) { return NotFound("Пользователь не найден."); }

                if (role != "student" && role != "admin" && role != "teacher") { return BadRequest($"Роли «{role}» не существует в системе"); }

                user.Role = role;
                await _db.SaveChangesAsync();   

                var notification = new NotificationModel
                {
                    NotificationMessage = $"Вам выдана новая роль: «{role}»",
                };
               
                await _notification.SendNotificationsAsync(user.Login, notification);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при смене роли пользователя с ID = {userId}");
                return StatusCode(500, "Произошла ошибка при обработке запроса. Попробуйте позже.");
            }
        }
    }
}