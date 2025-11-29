namespace PSB_HACKATHON.Models
{
    public class UserModel
    {
        public int Id { get; set; }
        //public string Name { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public List<CourseModel> Courses { get; set; }
    }
}
