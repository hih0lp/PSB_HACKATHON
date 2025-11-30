namespace PSB_HACKATHON.Models
{
    public class CoursesDTO
    {
        public string? Id { get; set; }
        public string? Content { get; set; }
        public List<UserDTO> Users { get; set; } = new();

    }
}
