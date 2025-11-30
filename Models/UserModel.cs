using System.Text.Json.Serialization;

namespace PSB_HACKATHON.Models
{
    public class UserModel
    {
        public int Id { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public string Role { get; set; } = "student";
        [JsonIgnore]
        public List<CourseModel>? Courses { get; set; } = new();
    }
}
