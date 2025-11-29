using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PSB_HACKATHON.Constants;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace PSB_HACKATHON.Controllers
{
    [Route("/courses")]
    public class CourseController : Controller
    {
        private readonly DB _dbContext;
        private readonly ICourseRepository _courseRepository;
        private readonly IHeaderRepository _headerRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<CourseController> _logger;
        public CourseController(ICourseRepository courseRepository, IHeaderRepository headerRepository, ILogger<CourseController> logger, DB db, IUserRepository userRepository)
        {
            _courseRepository = courseRepository;
            _headerRepository = headerRepository;
            _logger = logger;
            _dbContext = db;
            _userRepository = userRepository;
        }

        [HttpGet("get-courses/{userId}")]
        public async Task<IActionResult> GetCoursesByUserId(int userId)
        {
            return Json(await _courseRepository.GetByUserIdAsync(userId));
        }

        [HttpPost("create-course")]
        public async Task<IActionResult> CreateCourse()
        {
            return Content(JsonSerializer.Serialize(Guid.NewGuid().ToString()));
        }

        [HttpPost("edit/{courseId}")]
        public async Task<IActionResult> EditCourse(string courseId)
        {
            var headers = await Request.ReadFromJsonAsync<List<HeaderModel>>();
            if (headers is null) return BadRequest();

            try
            {
                var existingHeaders = await _courseRepository.GetCourseHeadersAsync(courseId);
                var currentCourse = await _courseRepository.GetAsync(courseId);
                if (existingHeaders is null || currentCourse is null) return NotFound();

                var headersToUpdate = headers.Where(x => existingHeaders.Any(e => e.Id == x.Id));
                var headersToCreate = headers.Where(x => !existingHeaders.Any(e => e.Id == x.Id));
                var headersToDelete = existingHeaders.Where(x => !headers.Any(t => t.Id == x.Id));

                foreach (var header in headersToUpdate)
                {
                    var exist = existingHeaders.First(x => x.Id == header.Id);
                    exist.Title = header.Title;
                    exist.Url = header.Url;
                    exist.Number = header.Number;
                }

                foreach (var headerToCreate in headersToCreate)
                {
                    var newHeader = new HeaderModel
                    {
                        Id = Guid.NewGuid().ToString(),
                        Title = headerToCreate.Title,
                        Course = currentCourse,
                        CourseId = courseId,
                        Number = headerToCreate.Number,
                    };
                    await _headerRepository.CreateAsync(newHeader);
                }

                await _headerRepository.UpdateRangeAsync(headersToUpdate.ToList());

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        public async Task<IActionResult> GetCooperating(string courseId, int userId)
        {
            var user = await _userRepository.GetUserAsync(userId);
            var course = await _courseRepository.GetAsync(courseId);

            if (user == null || course == null) return NotFound();
            if (user.Role != UserConsts.USER_ROLE_TUTOR) return Forbid();


            course.Users.Add(user);
            //user.Courses.Add(course);

            //await _userRepository.UpdateAsync(user);
            await _courseRepository.UpdateAsync(course);

            return Ok();
        }
    }
}
