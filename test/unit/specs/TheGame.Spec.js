import {mount} from '@vue/test-utils';
import Vue from 'vue';
import sinon from 'sinon';
import Game from '@/components/TheGame';
import Card from '@/components/GameCard';

function mountSutWith(props) {
  const sut = mount(Game, {propsData: props});
  const setCard = sinon.stub();
  sut.setMethods({setCard});
  return sut;
}

function mountSuthWith1Card() {
  const sut = mountSutWith({numberOfCards: 1, numberOfMatches: 2});
  const setCard = sinon.stub();
  sut.setMethods({setCard});
  return sut;
}

describe('Game.vue', () => {
  describe('rendering', () => {
    it('render it\'s wrapper', () => {
      const wrapper = mount(Game);
      expect(wrapper.contains('#game')).to.equal(true);
    });
    it('render the board wrapper', () => {
      const wrapper = mount(Game);
      expect(wrapper.contains('#board')).to.equal(true);
    });
  });

  describe('states', () => {
    describe('initial state', () => {
      let wrapper;
      beforeEach(() => {
        wrapper = mountSutWith({numberOfCards: 12, numberOfMatches: 2});
      });
      it('should contain the number of cards passed to it at the start of the game', () => {
        expect(wrapper.findAll(Card).length).to.equal(24);
      });
      it('should start with all cards facing down', () => {
        const allFaceDown = wrapper.findAll(Card).wrappers
          .reduce((acc, current) => !current.vm.flipped && acc, true);
        expect(allFaceDown).to.equal(true);
      });
    });
  });

  describe('gameplay', () => {
    describe('messages', () => {
      it('should contain an informational banner when starting', () => {
        const wrapper = mount(Game);
        expect(wrapper.find('.messageBanner').text()).to.equal('Click a card to begin');
      });

      it('should inform you when a match is not found', done => {
        const wrapper = mount(Game);
        wrapper.vm.incorrectMatch(0);
        Vue.nextTick().then(() => {
          expect(wrapper.find('.messageBanner').text()).to.equal('Try again');
          done();
        });
      });

      it('should inform you when a match is found', done => {
        const wrapper = mountSutWith({numberOfCards: 12, numberOfMatches: 2});
        wrapper.vm.correctMatch(0);
        Vue.nextTick().then(() => {
          expect(wrapper.find('.messageBanner').text()).to.equal('You found a match!');
          done();
        });
      });

      it('should inform you when the game is over', done => {
        const wrapper = mount(Game);
        wrapper.vm.endGame();
        Vue.nextTick().then(() => {
          expect(wrapper.find('.messageBanner').text()).to.equal('Congrats, you won!');
          done();
        });
      });
    });
    describe('clicking cards', () => {
      it('should flip the card when there are no others flipped up', () => {
        const wrapper = mountSuthWith1Card();
        const firstCard = wrapper.findAll(Card).at(0);
        firstCard.trigger('click');
        expect(firstCard.vm.flipped).to.equal(false);
      });

      it('should set the game state to flipping active', () => {
        const wrapper = mountSuthWith1Card();
        const firstCard = wrapper.findAll(Card).at(0);
        firstCard.trigger('click');
        expect(wrapper.vm.flippingActive).to.equal(true);
      });
    });

    describe('flipCard', () => {
      let wrapper;
      let correctMatch;
      let incorrectMatch;
      beforeEach(() => {
        wrapper = mountSuthWith1Card();
        correctMatch = sinon.stub();
        incorrectMatch = sinon.stub();
        wrapper.setMethods({correctMatch, incorrectMatch});
      });

      it('should correctly match if the cards id is equal to the currently flipped id', () => {
        const id = 1;
        const position = 0;
        wrapper.vm.currentlyFlipped.id = id;
        wrapper.vm.flipCard(id, position);
        expect(correctMatch.calledWith(position)).to.equal(true);
      });

      it('should incorrectly match if the cards id is not equal to the currently flipped id', () => {
        const id = 1;
        const position = 0;
        wrapper.vm.currentlyFlipped.id = 2;
        wrapper.vm.flippingActive = true;
        wrapper.vm.flipCard(id, position);
        expect(incorrectMatch.calledWith(position)).to.equal(true);
      });
    });

    describe('setCard (helper function)', () => {
      let wrapper;
      let $set;
      const position = 0;
      const properties = {property1: 42, property2: 'test'};
      beforeEach(() => {
        wrapper = mount(Game, {propsData: {numberOfCards: 1, numberOfMatches: 2}});
        $set = sinon.stub();
        wrapper.setMethods({$set});
      });

      it('should set every property at the given card position', () => {
        wrapper.vm.setCard(position, properties);
        expect(wrapper.vm.cards[position].property1).to.equal(42);
        expect(wrapper.vm.cards[position].property2).to.equal('test');
      });

      it('should call the set helper method at the given card position', () => {
        wrapper.vm.setCard(position, properties);
        expect($set.calledWith(wrapper.vm.cards,
          position,
          wrapper.vm.cards[position])).to.equal(true);
      });
    });

    describe('incorrectMatch', () => {
      let wrapper;
      let setCard;
      let clock;
      beforeEach(() => {
        clock = sinon.useFakeTimers();
        wrapper = mountSuthWith1Card();
        setCard = sinon.stub();
        wrapper.setMethods({setCard});
      });
      afterEach(() => {
        clock.restore();
      });
      it('should flip both cards down', done => {
        const position = 0;
        wrapper.vm.currentlyFlipped.position = 42;
        wrapper.vm.incorrectMatch(position);
        clock.tick(1000);
        Vue.nextTick().then(() => {
          expect(setCard.firstCall.calledWith(position, {flipped: false})).to.equal(true);
          expect(setCard.secondCall.calledWith(42, {flipped: false})).to.equal(true);
          done();
        });
      });

      it('should prevent other cards from being flipped', () => {
        const position = 0;
        const otherCardPosition = 1;
        wrapper.vm.currentlyFlipped.position = 42;
        wrapper.vm.incorrectMatch(position);
        wrapper.vm.flipCard(1, otherCardPosition);
        expect(setCard.neverCalledWith(otherCardPosition, {flipped: true})).to.equal(true);
      });
    });

    describe('correctMatch', () => {
      let wrapper;
      let setCard;
      let endGame;
      beforeEach(() => {
        wrapper = mountSuthWith1Card();
        setCard = sinon.stub();
        endGame = sinon.stub();
        wrapper.setMethods({setCard, endGame});
      });
      it('set both cards to matched', done => {
        const position = 0;
        wrapper.vm.currentlyFlipped.position = 42;
        wrapper.vm.correctMatch(position);
        Vue.nextTick().then(() => {
          expect(setCard.firstCall.calledWith(position, {matched: true})).to.equal(true);
          expect(setCard.secondCall.calledWith(42, {matched: true})).to.equal(true);
          done();
        });
      });
      it('should end the game if all matches are found', done => {
        const position = 0;
        wrapper.vm.currentlyFlipped.position = 42;
        wrapper.vm.correctMatch(position);
        Vue.nextTick().then(() => {
          expect(endGame.called).to.equal(true);
          done();
        });
      });
    });

    describe('resetBoard', () => {
      let wrapper;
      beforeEach(() => {
        wrapper = mount(Game);
        wrapper.vm.endGame();
      });
      it('should set required properties to initial state', () => {
        wrapper.vm.resetBoard();
        expect(wrapper.vm.matchFound).to.equal(false);
        expect(wrapper.vm.clickingLocked).to.equal(false);
        expect(wrapper.vm.gameOver).to.equal(false);
        expect(wrapper.vm.gameActive).to.equal(false);
        expect(wrapper.vm.matches).to.equal(0);
      });

      it('should reset the cards', () => {
        const resetCards = sinon.stub();
        wrapper.setMethods({resetCards});
        wrapper.vm.resetBoard();
        expect(resetCards.called).to.equal(true);
      });

      it('should init the board', () => {
        const initBoard = sinon.stub();
        wrapper.setMethods({initBoard});
        wrapper.vm.resetBoard();
        expect(initBoard.called).to.equal(true);
      });

      it('should set the banner back to the start message', done => {
        wrapper.vm.resetBoard();
        Vue.nextTick().then(() => {
          expect(wrapper.find('.messageBanner').text()).to.equal('Click a card to begin');
          done();
        });
      });
    });
  });
});
