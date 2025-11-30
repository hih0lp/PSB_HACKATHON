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
        [HttpGet("get-courses/{userId}")]
        [ProducesResponseType(typeof(List<CourseModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCoursesByUserId(int userId)
        {
            return Json(await _courseRepository.GetByUserIdAsync(userId));
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
            return Content(JsonSerializer.Serialize(Guid.NewGuid().ToString()));
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
                        Id = Guid.NewGuid().ToString(),
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
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("get-course/{courseId}")]
        public async Task<IActionResult> GetCourse(string courseId)
        {
            var course = await _courseRepository.GetAsync(courseId);
            if (course is null) return NotFound();


            return Json(course);
        }
        
            //public async Task<IActionResult> GetCourses()
            //{

            //}

        /// <summary>
        /// Присоединиться к курсу в качестве преподавателя
        /// </summary>
        /// <param name="courseId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        [HttpPost("get-cooperating/{courseId}/{userId}")]
        public async Task<IActionResult> GetCooperating(string courseId, int userId)
        {
            var user = await _userRepository.GetUserAsync(userId);
            var course = await _courseRepository.GetAsync(courseId);

            if (user == null || course == null) return NotFound();
            if (user.Role != UserConsts.USER_ROLE_TUTOR) return Forbid();


            course.Users.Add(user);
            await _courseRepository.UpdateAsync(course);

            return Ok();
        }
    }
}
