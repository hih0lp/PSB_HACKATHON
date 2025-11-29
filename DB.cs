using ERP_Proflipper_NotificationService.Models;
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
        public DbSet<NotificationModel> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserModel>()
                .HasMany(c => c.Courses)
                .WithMany(u => u.Users);

            modelBuilder.Entity<CourseModel>()
                .HasMany(t => t.Headers)
                .WithOne(c => c.Course)
                .HasForeignKey(k => k.CourseId);
        }
    }
}
