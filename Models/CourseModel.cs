using System.Text.Json.Serialization;

namespace PSB_HACKATHON.Models
{
    public class CourseModel
    {
        public string? Id { get; set; }
        public string? Content { get; set; }
        //public int UserId { get; set; }
        //public int AuthorId { get; set; `
        //public List<HeaderModel> Headers { get; set; }
        //[JsonIgnore]
        public List<UserModel>? Users { get; set; } = new();
    }
}
