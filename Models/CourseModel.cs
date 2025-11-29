namespace PSB_HACKATHON.Models
{
    public class CourseModel
    {
        public string? Id { get; set; }
        public string? Content { get; set; }
        //public int UserId { get; set; }
        //public List<HeaderModel> Headers { get; set; }
        public List<UserModel>? Users { get; set; }
    }
}
