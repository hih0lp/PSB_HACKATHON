using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Interfaces
{
    public interface IUserRepository
    {

        public Task<UserModel> GetUserAsync(int id);
        public Task UpdateAsync(UserModel user);
    }
}
