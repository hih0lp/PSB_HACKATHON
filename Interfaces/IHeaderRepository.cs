using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Interfaces
{
    public interface IHeaderRepository
    {
        public Task<HeaderModel> GetAsync(string id);
        public Task UpdateAsync();
    }
}
