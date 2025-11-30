using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Constants;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Ports
{
    public class CourseRepository : ICourseRepository
    {
        private readonly DB _dbcontext;
        public CourseRepository(DB db)
        {
            _dbcontext = db;
        }

        public async Task CreateAsync(CourseModel course)
        {
            await _dbcontext.Courses.AddAsync(course);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task UpdateAsync(CourseModel course)
        {
            _dbcontext.Courses.Update(course);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<CourseModel> GetAsync(string courseId)
        {
            return await _dbcontext.Courses.Include(t => t.Users).FirstOrDefaultAsync(x => x.Id == courseId);
        }

        public async Task DeleteAsync(string courseId)
        {
            var course = _dbcontext.Courses.Where(x => x.Id == courseId).First();
            _dbcontext.Courses.Remove(course);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<List<CourseModel>> GetNotTutorCourseAsync(int userId)
        {
            return await _dbcontext.Courses.Include(u => u.Users).Where(x => x.Users.Any(u => u.Id == userId && u.Role != UserConsts.USER_ROLE_TUTOR)).ToListAsync();
        }

        public async Task<List<CourseModel>> GetTutorCourseAsync(int userId)
        {
            return await _dbcontext.Courses.Include(u => u.Users).Where(x => x.Users.Any(u => u.Id == userId && u.Role == UserConsts.USER_ROLE_TUTOR)).ToListAsync();
        }

        public async Task<List<CourseModel>> GetAllCoursesAsync()
        {
            return await _dbcontext.Courses.Include(u => u.Users).ToListAsync();

        }

        //public async Task<List<HeaderModel>> GetCourseHeadersAsync(string courseId)
        //{
        //    return _dbcontext.Headers.Where(x => x.CourseId == courseId).ToList();
        //}
    }
}