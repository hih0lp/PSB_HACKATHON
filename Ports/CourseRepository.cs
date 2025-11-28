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
            return _dbcontext.Courses.Where(x => x.Id == courseId).First();
        }

        public async Task DeleteAsync(string courseId)
        {
            var course = _dbcontext.Courses.Where(x => x.Id == courseId).First();
            _dbcontext.Courses.Remove(course);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<List<CourseModel>> GetByUserIdAsync(int userId)
        {
            return _dbcontext.Courses.Where(x => x.UserId == userId).ToList();
        }

        public async Task<List<HeaderModel>> GetCourseHeadersAsync(string courseId)
        {
            return _dbcontext.Headers.Where(x => x.CourseId == courseId).ToList();
        }
    }
}