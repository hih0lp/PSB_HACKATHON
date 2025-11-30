using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Interfaces
{
    public interface ICourseRepository
    {
        public Task CreateAsync(CourseModel course);
        public Task UpdateAsync(CourseModel course);
        public Task DeleteAsync(string courseId);
        public Task<CourseModel> GetAsync(string courseId);
        public Task<List<CourseModel>> GetNotTutorCourseAsync(int userId);
        public Task<List<CourseModel>> GetTutorCourseAsync(int userId);
        public Task<List<CourseModel>> GetAllCoursesAsync();
        //public Task<List<HeaderModel>> GetCourseHeadersAsync(string courseId);
        //public async Task<>
    }
}
