namespace PSB_HACKATHON.Models
{
    public class NotificationModel
    {
        public int Id { get; set; }
        public string NotificationMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserLogin { get; set; }
        public string? RedirectUri { get; set; }
        public bool IsSent { get; set; } = false;
        //public DateTime SendingAt { get; set; }
    }

    //public class NotificationDAO
    //{
    //    public async Task ReadNotification()
    //    {

    //    }
    //}
}
