using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Security.Cryptography.X509Certificates;

namespace PSB_HACKATHON.Controllers
{
    [Route("/documents")]
    public class DocumentController : Controller
    {
        private readonly ILogger<DocumentController> _logger;

        public DocumentController(ILogger<DocumentController> logger)
        {
            _logger = logger;
        }

        [HttpPost("{courseId}")]
        public async Task<IActionResult> SaveDocument(string courseId)
        {
            IFormFileCollection files = Request.Form.Files;
            string path = Path.Combine(Directory.GetCurrentDirectory(), "Documents", courseId);

            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }

                foreach (var file in files)
                {
                    var originalFileName = file.FileName; 
                    var safeFileName = Path.GetFileName(originalFileName); 
                    var fullFilePath = Path.Combine(path, safeFileName);

                    using (var fs = new FileStream(fullFilePath, FileMode.Create))
                    {
                        await file.CopyToAsync(fs);
                    }

                    _logger.LogInformation("Сохранен: {FileName} -> {Path}", originalFileName, fullFilePath);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка сохранения файлов для курса {CourseId}", courseId);
                return BadRequest("Ошибка сохранения файлов");
            }
        }

        [HttpDelete("{courseId}/{headerId}/{headerNumber}/{fileName}")]
        public async Task<IActionResult> DeleteDocument(string courseId, string headerId, int headerNumber, string fileName)
        {
            string path = Path.Combine(Directory.GetCurrentDirectory(), "Documents", courseId, headerId, headerNumber.ToString(), fileName);

            try
            {
                System.IO.File.Delete(path);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest();
            }
        }

        [HttpGet("{courseId}")]
        public async Task<IActionResult> GetFiles(string courseId)
        {
            string directoryPath = Path.Combine(Directory.GetCurrentDirectory(), "Documents", courseId);

            if (!Directory.Exists(directoryPath))
                return NotFound($"Директория не найдена: {directoryPath}");

            var absolutePaths = Directory.GetFiles(directoryPath)
                                        .Select(filePath => filePath) // Просто возвращаем полный путь
                                        .ToList();

            return Json(absolutePaths);
        }
    }
}
