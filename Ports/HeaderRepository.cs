using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Ports
{
    public class HeaderRepository : IHeaderRepository
    {
        public Task<HeaderModel> GetAsync(string id);
        public Task UpdateAsync();
    }
}
