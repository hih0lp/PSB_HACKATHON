using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.Models;

namespace PSB_HACKATHON.Ports
{
    public class HeaderRepository : IHeaderRepository
    {
        private readonly DB _dbcontext;

        public HeaderRepository(DB db)
        {
            _dbcontext = db;
        }

        public async Task<HeaderModel> GetAsync(string headerId)
        {
            return _dbcontext.Headers.Where(x => x.Id == headerId).First();
        }

        public async Task UpdateAsync(HeaderModel header)
        {
            _dbcontext.Headers.Update(header);
            await _dbcontext.SaveChangesAsync();
        
        }

        public async Task CreateAsync(HeaderModel header)
        {
            await _dbcontext.Headers.AddAsync(header);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task UpdateRangeAsync(List<HeaderModel> headerModels)
        {
            _dbcontext.UpdateRange(headerModels);
            await _dbcontext.SaveChangesAsync();
        }
    }
}
