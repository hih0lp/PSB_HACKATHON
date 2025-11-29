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

                var existingFiles = Directory.GetFiles(path)
                    .Select(Path.GetFileName)
                    .ToList();

                var incomingFileNames = files.Select(f => f.Name).ToList();

                var filesToDelete = existingFiles.Except(incomingFileNames).ToList();

                foreach (var fileName in filesToDelete)
                {
                    var filePath = Path.Combine(path, fileName);
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }

                // Сохраняем/перезаписываем пришедшие файлы
                foreach (var file in files)
                {
                    var fullFilePath = Path.Combine(path, file.Name);
                    using (var fs = new FileStream(fullFilePath, FileMode.Create))
                    {
                        await file.CopyToAsync(fs);
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return BadRequest(ex.Message);
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
                                        .Select(filePath => new
                                        {
                                            FileName = Path.GetFileName(filePath),
                                            AbsolutePath = $"/Documents/{courseId}/{Path.GetFileName(filePath)}",
                                            FullPath = filePath
                                        })
                                        .ToList();

            return Json(absolutePaths);
        }
    }
}
