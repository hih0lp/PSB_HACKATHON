namespace PSB_HACKATHON.Models
{
    public class HeaderModel
    {
        public string Id { get; set; }
        public int Number { get; set; }
        public string Title { get; set; }
        public string Url { get; set; }
        public string CourseId { get; set; }
        
        public CourseModel Course { get; set; } 
    }
}
