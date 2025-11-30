using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Models;
using PSB_HACKATHON.Requests;

namespace PSB_HACKATHON.Controllers
{
    public class AuthController : Controller
    {
        private readonly DB _db;
        private ILogger<AuthController> _logger;

        public AuthController(DB db, ILogger<AuthController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost]
        [Route("Auth/Register")]
        public async Task<IActionResult> Register([FromBody] RegRequest user)
        {
            try
            {
                if (user == null) { return BadRequest("Пустое тело запроса"); }
                if (await _db.Users.AnyAsync(u => u.Email == user.Email)) { return BadRequest("Пользователь с такой почтой уже существует"); }
                if (await _db.Users.AnyAsync(u => u.Login == user.Login)) { return BadRequest("Пользователь с таким логином уже существует"); }

                var res = new UserModel
                {
                    Login = user.Login,
                    Email = user.Email,
                    Password = user.Password,
                };
                await _db.Users.AddAsync(res);
                int checkSave = await _db.SaveChangesAsync();
                
                if (checkSave > 0) { return Ok( new { userId = res.Id} ); } 
                else { return BadRequest("Не удалось добавить пользователя, проверьте корректность полей"); }
            }
            catch (Exception ex) 
            {
                _logger.LogError($"Не удалось зарегестрировать пользователя");
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

                var check = await _db.Users.FirstOrDefaultAsync(u => u.Login == user.Login && u.Password == user.Password);
                if (check == null) { return BadRequest("Неверный логин или пароль, попробуйте снова"); }

                return Ok(new { userId = check.Id, role = check.Role });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Не удалось выполнить вход пользователя");
                return StatusCode(500, "Возникла ошибка при входе, попробуйте позже");
            }
        }
    }
}