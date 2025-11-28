using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
//using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Controllers
{
    public class UserController : Controller
    {
        private readonly ILogger<UserController> _logger;

        public UserController(ILogger<UserController> logger)
        {
            _logger = logger;
        }




    }
}
