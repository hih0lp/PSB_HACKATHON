using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Models;

namespace PSB_HACKATHON
{
    public class DB : DbContext
    {
        public DB(DbContextOptions options) : base(options){ }

        public DbSet<CourseModel> Courses { get; set; }
        public DbSet<HeaderModel> Headers { get; set; }
        public DbSet<UserModel> Users { get; set; }
    }
}
