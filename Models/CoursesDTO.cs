namespace PSB_HACKATHON.Models
{
    public class CoursesDTO
    {
        public string? Id { get; set; }
        public string? Content { get; set; }
        public List<UserModel> Users { get; set; } = new();

    }
}
