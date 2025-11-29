using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Models;
using PSB_HACKATHON.Requests;

namespace PSB_HACKATHON.Controllers
{
    public class AdminController : Controller
    {
        private readonly DB _db;
        private ILogger<AdminController> _logger;

        public AdminController(DB db, ILogger<AdminController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost]
        [Route("Admin/GetUsers")]
        public async Task<IActionResult> GetUsers( int userId)
        {
            try
            {
                if (await _db.Users.AnyAsync(u => u.Id == userId)) { return BadRequest("Пользователь с такой почтой уже существует"); }

                await _db.Users.AddAsync(user);
                int checkSave = await _db.SaveChangesAsync();
                
                if (checkSave > 0) { return Ok(); } 
                else { return BadRequest("Не удалось добавить пользователя, проверьте корректность полей"); }
            }
            catch (Exception ex) 
            {
                _logger.LogError($"Не удалось зарегестрировать пользователя с id = {user.Id}");
                return StatusCode(500, $"Возникла ошибка при регистрации, попробуйте позже\n{ex}");
            }
        }

        [HttpPost]
        [Route("Auth/Login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest user)
        {
            try
            {
                if (user == null) { return BadRequest("Пустое тело запроса"); }

                bool userExists = await _db.Users
                    .AnyAsync(u => u.Login == user.Login && u.Password == user.Password);

                if (!userExists)
                {
                    return BadRequest("Неверный логин или пароль, попробуйте снова");
                }

                return Ok(new { message = "Успешная авторизация" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Не удалось зарегестрировать пользователя");
                return StatusCode(500, $"Возникла ошибка при регистрации, попробуйте позже\n{ex}");
            }
        }
    }
}