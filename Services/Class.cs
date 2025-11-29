namespace PSB_HACKATHON.Services
{
    public class AuthService
    {
        private readonly IConfiguration _config;
        private readonly DB _db;
        public AuthService(DB db, IConfiguration config) 
        {
            _config = config;
            _db = db;
        }

    }
}
