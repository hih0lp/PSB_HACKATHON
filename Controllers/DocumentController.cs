using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        [HttpPost("{courseId}/{headerId}/{headerNumber}")]
        public async Task<IActionResult> SaveDocument(string courseId, string headerId, int headerNumber)
        {
            IFormFileCollection files = Request.Form.Files;
            //var imgId = Guid.NewGuid().ToString();
            string path = Path.Combine(Directory.GetCurrentDirectory(), "Documents", courseId, headerId, headerNumber.ToString());

            using var fileStream = new FileStream(path, FileMode.Create);

            foreach (var file in files)
            {
                await file.CopyToAsync(fileStream);
            }

            return Json(path);
        }

        [HttpDelete("{courseId}/{headerId}/{headerNumber}/{imgId}")]
        public async Task<IActionResult> DeleteDocument(string courseId, string headerId, int headerNumber, string imgId)
        {
            string path = Path.Combine(Directory.GetCurrentDirectory(), "Documents", courseId, headerId, headerNumber.ToString(), imgId);

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

        [HttpGet]
        public async Task<IActionResult> GetFile(string path)
        {
            var fileBytes = await System.IO.File.ReadAllBytesAsync(path);
            return File(fileBytes, "application/octet-stream");
        }
    }
}
