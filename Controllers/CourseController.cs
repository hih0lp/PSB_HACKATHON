using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PSB_HACKATHON.Constants;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;
using System.Collections.Immutable;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace PSB_HACKATHON.Controllers
{
    [Route("/courses")]
    public class CourseController : Controller
    {
        private readonly DB _dbContext;
        private readonly ICourseRepository _courseRepository;
        //private readonly IHeaderRepository _headerRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<CourseController> _logger;
        private readonly IConfiguration _config;

        public CourseController(ICourseRepository courseRepository, ILogger<CourseController> logger, DB db, IUserRepository userRepository, IConfiguration configuration)
        {
            _courseRepository = courseRepository;
            //_headerRepository = headerRepository;
            _logger = logger;
            _dbContext = db;
            _userRepository = userRepository;
            _config = configuration;
        }

        /// <summary>
        /// Получить курсы пользователя по его идентификатору
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <returns>Список курсов пользователя</returns>
        [HttpGet("get-course/{courseId}")]
        [ProducesResponseType(typeof(List<CourseModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCoursesByUserId(string courseId)
        {
            var course = await _courseRepository.GetAsync(courseId);
            if (course == null) return NotFound();

            var courseDto = new CoursesDTO
            {
                Id = course.Id,
                Content = course.Content,
                Users = course.Users?.Select(u => new UserDTO
                {
                    Id = u.Id,
                    Login = u.Login,
                    Role = u.Role
                }).ToList()
            };

            return Ok(courseDto);
        }


        /// <summary>
        /// Создать новый курс
        /// </summary>
        /// <param name="">Данные курса</param>
        /// <returns>Айди созданного курса </returns>
        [HttpPost("create-course")]
        [ProducesResponseType(typeof(CourseModel), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateCourse()
        {
            var id = Guid.NewGuid().ToString();
            var newCourse = new CourseModel
            {
                Id = id,
            };

            await _courseRepository.CreateAsync(newCourse);

            return Content(JsonSerializer.Serialize(id));
        }


        /// <summary>
        /// Редактирование курса
        /// </summary>
        /// <param name="courseId"></param>
        /// <returns></returns>
        [HttpPost("edit/{courseId}")]
        [ProducesResponseType(typeof(CourseModel), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> EditCourse(string courseId)
        {
            var courseDto = await Request.ReadFromJsonAsync<CoursesDTO>();
            var dbCourse = await _courseRepository.GetAsync(courseId);

            try
            {
                if (dbCourse is null)
                {
                    var newCourse = new CourseModel
                    {
                        Id = courseId,
                        Content = courseDto.Content,
                    };
                    await _courseRepository.CreateAsync(newCourse);
                }
                else
                {
                    dbCourse.Content = courseDto.Content;
                    await _courseRepository.UpdateAsync(dbCourse);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("get-tutor-courses/{userId}")]
        public async Task<IActionResult> GetMyTutorCourses(int userId)
        {
            if (userId == null) return NotFound("Юзер айди null");
            var course = await _courseRepository.GetTutorCourseAsync(userId);
            //if (course is null) return NotFound();


            return Json(course);
        }

        [HttpGet("get-not-tutor-courses/{userId}")]
        public async Task<IActionResult> GeMyNotTutorCourse(int userId)
        {
            if (userId == null) return NotFound("Юзер айди null");
            var courses = await _courseRepository.GetTutorCourseAsync(userId);

            var courseDtos = courses.Select(c => new CoursesDTO
            {
                Id = c.Id,
                Content = c.Content,
                Users = c.Users?.Select(u => new UserDTO
                {
                    Id = u.Id,
                    Login = u.Login,
                    Role = u.Role
                }).ToList()
            }).ToList();

            return Json(courseDtos);
        }

        [HttpGet("get-all-courses")]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _courseRepository.GetAllCoursesAsync();

            var courseDtos = courses.Select(c => new CoursesDTO
            {
                Id = c.Id,
                Content = c.Content,
                Users = c.Users?.Select(u => new UserDTO
                {
                    Id = u.Id,
                    Login = u.Login,
                    Role = u.Role
                }).ToList()
            }).ToList();

            return Json(courseDtos);
        }

        /// <summary>
        /// Присоединиться к курсу в качестве преподавателя
        /// </summary>
        /// <param name="courseId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        [HttpPost("subscribe-on/{courseId}/{userId}")]
        public async Task<IActionResult> SubscribeOn(string courseId, int userId)
        {
            try
            {
                var user = await _userRepository.GetUserAsync(userId);
                var course = await _courseRepository.GetAsync(courseId);

                //_logger.LogInformation(user.Id.ToString());
                //_logger.LogInformation(course.Id);

                if (user == null || course == null)
                    return NotFound("Нет такого юзера или курса");

                if (user.Role != UserConsts.USER_ROLE_TUTOR)
                    return Unauthorized("Нет прав");

                // Проверяем, не подписан ли уже
                if (user.Courses.Any(c => c.Id == courseId))
                    return BadRequest("Уже подписан на этот курс");

                // Добавляем курс пользователю
                user.Courses.Add(course);
                await _userRepository.UpdateAsync(user);

                return Ok(new { message = "Успешно подписан на курс" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка подписки на курс");
                return StatusCode(500, "Ошибка в логике");
            }
        }
    }
}
