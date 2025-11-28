using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace PSB_HACKATHON.Controllers
{
    [Route("/courses")]
    public class CourseController : Controller
    {
        private readonly ICourseRepository _courseRepository;
        public CourseController(ICourseRepository courseRepository)
        {
            _courseRepository = courseRepository;
        }

        [HttpGet("/get-courses/{userId}")]
        public async Task<IActionResult> GetCoursesByUserId(int userId)
        {
            return Json(await _courseRepository.GetByUserIdAsync(userId));
        }

        [HttpPost("/create-course")]
        public async Task<IActionResult> CreateCourse()
        {
            return Content(JsonSerializer.Serialize(Guid.NewGuid().ToString()));
        }

        [HttpPost("/edit/{courseId}")]
        public async Task<IActionResult> EditCourse(string courseId)
        {
            var headers = await Request.ReadFromJsonAsync<List<HeaderModel>>();

            foreach (var item in await _courseRepository.GetCourseHeadersAsync(courseId))
            {
                //проверка на существование в бд
                //если существует, то присваиваем поля
                //если не существует, то создаем и сохраняем
            }
        }
    }
}
