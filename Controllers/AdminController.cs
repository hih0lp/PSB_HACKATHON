using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Services;
using PSB_HACKATHON.Controllers;

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
                if (userRole != "Admin") { return Unauthorized("Недостаточно прав"); }

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
        public async Task<IActionResult> ChangeRole(int userId)
        {
            try
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null) { return NotFound("Пользователь не найден."); }
                user.Role = "teacher";
                await _db.SaveChangesAsync();

                var message = _notification.CreateContentWithoutURI("Вам выдана новая роль: \"Преподаватель\"");


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