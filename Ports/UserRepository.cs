using Microsoft.EntityFrameworkCore;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Ports
{
    public class UserRepository : IUserRepository
    {
        private readonly DB _dbcontext;

        public UserRepository(DB dbcontext)
        {
            _dbcontext = dbcontext;
        }


        public async Task<UserModel> GetUserAsync(int id)
        {
            return await _dbcontext.Users.Include(c => c.Courses).FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task UpdateAsync(UserModel user)
        {
            _dbcontext.Users.Update(user);
            await _dbcontext.SaveChangesAsync();
        }
    }
}
